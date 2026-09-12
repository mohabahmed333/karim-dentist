import type { createServiceClient } from "@/lib/supabase/service";
import type { BookingState } from "./bookingState";
import { DEFAULT_AI_SETTINGS, type WhatsappAiSettings, type WhatsappAiState } from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

const JOB_LEASE_SECONDS = 90;

/** Global settings, falling back to the safe defaults (mode: off). */
export async function loadAiSettings(
  db: ServiceClient,
): Promise<WhatsappAiSettings> {
  const { data } = await db
    .from("whatsapp_ai_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  return (data as WhatsappAiSettings | null) ?? DEFAULT_AI_SETTINGS;
}

export async function loadConversationState(
  db: ServiceClient,
  conversationId: string,
): Promise<WhatsappAiState | null> {
  const { data } = await db
    .from("whatsapp_ai_state")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  return (data as WhatsappAiState | null) ?? null;
}

export async function saveOfferedSlots(
  db: ServiceClient,
  conversationId: string,
  slotIds: string[],
): Promise<void> {
  await db.from("whatsapp_ai_state").upsert(
    {
      conversation_id: conversationId,
      offered_slot_ids: slotIds,
      offered_at: new Date().toISOString(),
      // Mirrors the admin proposal expiry: a slot list older than this is stale.
      state_expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id" },
  );
}

/**
 * Persist booking progress for a conversation.
 *
 * Written even when the reply itself was drafted: what the patient told us is
 * still true whether or not our answer went out, and dropping it is exactly how
 * the assistant came to ask the same question twice.
 */
export async function saveBookingState(
  db: ServiceClient,
  conversationId: string,
  state: BookingState,
): Promise<void> {
  await db.from("whatsapp_ai_state").upsert(
    {
      conversation_id: conversationId,
      step: state.step,
      pending: state.pending as never,
      state_expires_at: state.expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id" },
  );
}

/** Mark that a human is handling the thread, so the bot stays quiet. */
export async function markHumanHandoff(
  db: ServiceClient,
  conversationId: string,
  minutes: number,
): Promise<void> {
  await db.from("whatsapp_ai_state").upsert(
    {
      conversation_id: conversationId,
      handoff_until: new Date(Date.now() + minutes * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id" },
  );
}

/**
 * Create one job per inbound message.
 *
 * The unique index on inbound_message_id is what makes this safe to call from
 * both the webhook and a retry: a duplicate insert is swallowed, so a message
 * can never be answered twice.
 */
export async function enqueueAutoReplyJob(
  db: ServiceClient,
  input: { conversationId: string; inboundMessageId: string },
): Promise<string | null> {
  const { data, error } = await db
    .from("whatsapp_ai_jobs")
    .insert({
      conversation_id: input.conversationId,
      inbound_message_id: input.inboundMessageId,
    })
    .select("id")
    .single();
  if (error) {
    // 23505 = unique violation: the job already exists, which is correct.
    if ((error as { code?: string }).code === "23505") return null;
    throw error;
  }
  return (data as { id: string }).id;
}

/**
 * Take ownership of a job.
 *
 * The conditional update doubles as the lock: if no row comes back, another
 * worker (the `after()` callback or the sweeper) already owns it.
 */
export async function claimJob(db: ServiceClient, jobId: string) {
  const now = new Date();
  const { data } = await db
    .from("whatsapp_ai_jobs")
    .update({
      status: "running",
      lease_until: new Date(now.getTime() + JOB_LEASE_SECONDS * 1000).toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", jobId)
    .or(`status.eq.queued,and(status.eq.running,lease_until.lt.${now.toISOString()})`)
    .select("*")
    .maybeSingle();
  return data;
}

export async function finishJob(
  db: ServiceClient,
  jobId: string,
  patch: {
    status: "sent" | "drafted" | "skipped" | "failed" | "abandoned" | "queued";
    skipReason?: string | null;
    lastError?: string | null;
    outboundMessageId?: string | null;
    sendStartedAt?: string | null;
  },
): Promise<void> {
  await db
    .from("whatsapp_ai_jobs")
    .update({
      status: patch.status,
      skip_reason: patch.skipReason ?? null,
      last_error: patch.lastError ?? null,
      outbound_message_id: patch.outboundMessageId ?? null,
      ...(patch.sendStartedAt ? { send_started_at: patch.sendStartedAt } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

/** Record every decision, so thresholds can be tuned from real traffic. */
export async function recordAiEvent(
  db: ServiceClient,
  input: {
    conversationId: string;
    jobId?: string | null;
    messageId?: string | null;
    decision: "auto_send" | "draft" | "skip" | "error";
    reason?: string;
    intent?: string | null;
    confidence?: number | null;
    language?: string | null;
    handoff?: boolean;
    injectionFlags?: string[];
    model?: string | null;
    latencyMs?: number | null;
    envelope?: unknown;
  },
): Promise<void> {
  await db.from("whatsapp_ai_events").insert({
    conversation_id: input.conversationId,
    job_id: input.jobId ?? null,
    message_id: input.messageId ?? null,
    decision: input.decision,
    reason: input.reason ?? "",
    intent: input.intent ?? null,
    confidence: input.confidence ?? null,
    language: input.language ?? null,
    handoff: input.handoff ?? false,
    injection_flags: input.injectionFlags ?? [],
    model: input.model ?? null,
    latency_ms: input.latencyMs ?? null,
    envelope: (input.envelope ?? {}) as never,
  });
}

/** AI messages sent in the last hour, for the rate caps. */
/** Statuses an outbound message passes through once it has actually gone out. */
const DELIVERED_STATUSES = ["sent", "delivered", "read"] as const;

/**
 * Has the assistant ever spoken in this conversation?
 *
 * Deliberately not time-boxed. It decides whether to introduce itself, and a
 * quiet hour does not make it a stranger again — counting only the last hour
 * had it introducing itself over and over in one conversation.
 */
export async function countAiRepliesEver(
  db: ServiceClient,
  conversationId: string,
): Promise<number> {
  const { count } = await db
    .from("whatsapp_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("sender_kind", "ai")
    .in("status", DELIVERED_STATUSES);
  return count ?? 0;
}

export async function countRecentAiReplies(
  db: ServiceClient,
  conversationId: string,
): Promise<{ conversationLastHour: number; globalLastHour: number }> {
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const [conversation, global] = await Promise.all([
    db
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender_kind", "ai")
      // Not `= 'sent'`: a delivered message moves to 'delivered' and then
      // 'read', so matching only 'sent' counted almost nothing and the rate
      // limits never saw the replies they exist to limit.
      .in("status", DELIVERED_STATUSES)
      .gte("wa_timestamp", since),
    db
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_kind", "ai")
      .in("status", DELIVERED_STATUSES)
      .gte("wa_timestamp", since),
  ]);
  return {
    conversationLastHour: conversation.count ?? 0,
    globalLastHour: global.count ?? 0,
  };
}

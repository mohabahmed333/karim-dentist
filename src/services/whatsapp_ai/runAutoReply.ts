import { buildAutoReplyPrompt, type BuildPromptInput } from "./buildAutoReplyPrompt";
import { decideAutoReply } from "./decideAutoReply";
import { extractAutoReplyEnvelope } from "./extractAutoReplyEnvelope";
import { injectionHeuristics } from "./injectionHeuristics";
import { evaluateAutoReplyPolicy, type PolicyInput } from "./policy";
import { isSendableReply, stripInternalIds } from "./replyGuards";
import type { AutoReplyEnvelope, BotAction } from "./schemas";

export type RunOutcome = {
  status: "sent" | "drafted" | "skipped" | "failed";
  reason: string;
  messageId?: string | null;
  envelope?: AutoReplyEnvelope;
};

export type RunDeps = {
  /** Everything the policy gate needs, already loaded. */
  policy: Omit<PolicyInput, "now">;
  prompt: Omit<BuildPromptInput, "history"> & {
    history: BuildPromptInput["history"];
  };
  /** The patient message this run is answering. */
  inboundText: string;
  conversationId: string;

  chat: (messages: { role: string; content: string }[]) => Promise<string>;
  send: (text: string) => Promise<{ id: string }>;
  draft: (text: string, reason: string) => Promise<{ id: string }>;
  runActions: (actions: BotAction[]) => Promise<{ ok: boolean; message: string }>;
  rememberOfferedSlots: (slotIds: string[]) => Promise<void>;
  record: (event: {
    decision: "auto_send" | "draft" | "skip" | "error";
    reason: string;
    envelope?: AutoReplyEnvelope;
    injectionFlags: string[];
    latencyMs: number;
  }) => Promise<void>;
  now?: () => Date;
};

/**
 * Produce one auto-reply.
 *
 * Never throws: every path — including a model outage — resolves to a status
 * and a recorded event, because this runs inside `after()` where an exception
 * would vanish silently and leave the patient with no reply and no trace.
 */
export async function runAutoReply(deps: RunDeps): Promise<RunOutcome> {
  const startedAt = Date.now();
  const flags = injectionHeuristics(deps.inboundText);

  const gate = evaluateAutoReplyPolicy({
    ...deps.policy,
    now: deps.now?.() ?? new Date(),
  });

  if (gate.allow === "none") {
    await deps.record({
      decision: "skip",
      reason: gate.reason,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
    });
    return { status: "skipped", reason: gate.reason };
  }

  const built = buildAutoReplyPrompt(deps.prompt);

  let raw: string;
  try {
    raw = await deps.chat(built.messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI call failed";
    await deps.record({
      decision: "error",
      reason: message,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
    });
    // Deliberately no apology to the patient: silence is recoverable by the
    // sweeper or by staff, an incorrect message is not.
    return { status: "failed", reason: message };
  }

  const { envelope: rawEnvelope } = extractAutoReplyEnvelope(raw);

  // Internal identifiers must never reach a patient. The model is shown slots
  // as `slotId=<uuid>` and told to copy the id exactly — meaning into the
  // structured field — and it has been observed copying them into the prose
  // too. The prompt asks; this enforces.
  const guarded = stripInternalIds(rawEnvelope.reply);
  const envelope = { ...rawEnvelope, reply: guarded.reply };
  if (guarded.violations.length > 0 && !isSendableReply(envelope.reply)) {
    // Nothing meaningful survived the strip — a human should write this one.
    const { id } = await deps.draft(rawEnvelope.reply, "reply_was_all_ids");
    await deps.record({
      decision: "draft",
      reason: "reply_was_all_ids",
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
    });
    return { status: "drafted", reason: "reply_was_all_ids", messageId: id, envelope };
  }

  // Remember what we offered, so the next turn can validate the patient's pick
  // against the server's list rather than the model's memory.
  if (envelope.offeredSlotIds.length > 0) {
    const allowed = envelope.offeredSlotIds.filter((id) =>
      built.offeredSlotIds.includes(id),
    );
    await deps.rememberOfferedSlots(allowed);
  }

  const decision = decideAutoReply({
    envelope,
    injectionFlags: flags,
    offeredSlotIds: built.offeredSlotIds,
    ownReservationIds: deps.prompt.reservations.map((r) => r.id),
    allowBookingWrites: deps.policy.settings.allow_booking_writes,
  });

  // The context gate can veto the content gate, never the other way round.
  const finalAction = gate.allow === "draft" ? "draft" : decision.action;
  const reason = gate.allow === "draft" ? gate.reason : decision.reason;

  if (finalAction === "draft") {
    const { id } = await deps.draft(envelope.reply, reason);
    await deps.record({
      decision: "draft",
      reason,
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
    });
    return { status: "drafted", reason, messageId: id, envelope };
  }

  if (decision.actions.length > 0) {
    const result = await deps.runActions(decision.actions);
    if (!result.ok) {
      // A booking that lost a race must not be reported as done. Draft the
      // real outcome instead of sending the model's optimistic sentence.
      const { id } = await deps.draft(result.message, "action_failed");
      await deps.record({
        decision: "draft",
        reason: "action_failed",
        envelope,
        injectionFlags: flags,
        latencyMs: Date.now() - startedAt,
      });
      return { status: "drafted", reason: "action_failed", messageId: id, envelope };
    }
  }

  const { id } = await deps.send(envelope.reply);
  await deps.record({
    decision: "auto_send",
    reason,
    envelope,
    injectionFlags: flags,
    latencyMs: Date.now() - startedAt,
  });
  return { status: "sent", reason, messageId: id, envelope };
}

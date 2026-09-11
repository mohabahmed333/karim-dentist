import { readFile } from "node:fs/promises";
import path from "node:path";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { clinicContactFromSettings } from "@/lib/clinic/whatsappClinicContact";
import type { createServiceClient } from "@/lib/supabase/service";
import { groqChat } from "@/services/ai_groq/callGroq";
import { addOptOut, isOptOutMessage } from "@/services/patient_notifications/optouts";
import { searchClinicKnowledge } from "@/services/clinic_knowledge/search";
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { insertOutboundMessage } from "@/services/whatsapp/mutations";
import { sendWhatsappMessage } from "@/services/whatsapp/sendMessage";
import { runAutoReply } from "./runAutoReply";
import {
  claimJob,
  countRecentAiReplies,
  finishJob,
  loadAiSettings,
  loadConversationState,
  recordAiEvent,
  saveOfferedSlots,
} from "./store";
import type { BotAction } from "./schemas";

type ServiceClient = ReturnType<typeof createServiceClient>;

const HISTORY_TURNS = 10;
const SLOT_OFFER_LIMIT = 5;
/** Below the webhook route's maxDuration, so the reply is never cut off mid-send. */
const GROQ_TIMEOUT_MS = 8000;

const FALLBACK_PROMPT = `You are the front desk of The Dental Lounge on WhatsApp.
Never diagnose or advise on medication. Never invent hours, prices or times.
If unsure, set handoff true. Reply with one JSON object matching the agreed schema.`;

async function loadPrompt(): Promise<string> {
  try {
    return await readFile(
      path.join(process.cwd(), "prompts/whatsapp-autoresponder.md"),
      "utf8",
    );
  } catch {
    return FALLBACK_PROMPT;
  }
}

/**
 * Run one queued auto-reply job.
 *
 * Claiming is a conditional update that doubles as a lock, so the `after()`
 * callback and the sweeper can both call this without racing. Anything that
 * throws is recorded on the job rather than propagated — this runs where an
 * exception would be invisible.
 */
export async function processAutoReplyJob(
  db: ServiceClient,
  jobId: string,
): Promise<string> {
  const job = await claimJob(db, jobId);
  if (!job) return "not_claimed";

  try {
    const [{ data: conversation }, { data: inbound }, settings, state] =
      await Promise.all([
        db
          .from("whatsapp_conversations")
          .select("id,phone_number,contact_name,status,last_inbound_at,patient_key")
          .eq("id", job.conversation_id)
          .maybeSingle(),
        db
          .from("whatsapp_messages")
          .select("id,body,message_type")
          .eq("id", job.inbound_message_id)
          .maybeSingle(),
        loadAiSettings(db),
        loadConversationState(db, job.conversation_id),
      ]);

    if (!conversation || !inbound) {
      await finishJob(db, jobId, { status: "skipped", skipReason: "missing_rows" });
      return "missing_rows";
    }

    // A patient who texts STOP is unsubscribing, not opening a conversation.
    // Handled before anything else — above all before the model, which would
    // otherwise try to answer "stop" as if it were a question. This opts them
    // out of business-initiated messages only: if they write to the clinic
    // again later, the assistant still answers them.
    if (isOptOutMessage(inbound.body)) {
      await addOptOut(db, conversation.phone_number, "patient sent an opt-out keyword").catch(
        () => undefined,
      );
      await recordAiEvent(db, {
        conversationId: conversation.id,
        jobId,
        decision: "skip",
        reason: "opted_out_keyword",
        intent: null,
        confidence: null,
        language: null,
        handoff: false,
        injectionFlags: [],
        model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
        latencyMs: 0,
        envelope: {},
      });
      await finishJob(db, jobId, { status: "skipped", skipReason: "opted_out_keyword" });
      return "opted_out";
    }

    // Slots this conversation was explicitly offered and may still claim — a
    // waitlist offer, or times the assistant itself listed. Written by
    // saveOfferedSlots but, until now, never read back: the bot only ever saw
    // the next five open slots, so "take it" for an offered slot further out
    // was refused as slot_not_offered.
    const heldSlotIds =
      state?.state_expires_at && Date.parse(state.state_expires_at) > Date.now()
        ? (state.offered_slot_ids ?? [])
        : [];

    const nowIso = new Date().toISOString();
    const [
      counts,
      { data: lastHuman },
      { data: slotRows },
      { data: settingsRow },
      { data: serviceRows },
      { data: history },
      reservations,
      { data: clinicHours },
      knowledge,
      { data: heldSlotRows },
    ] = await Promise.all([
      countRecentAiReplies(db, conversation.id),
      db
        .from("whatsapp_messages")
        .select("wa_timestamp")
        .eq("conversation_id", conversation.id)
        .eq("direction", "outbound")
        .eq("sender_kind", "human")
        .order("wa_timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("appointment_slots")
        .select("id,starts_at")
        .eq("status", "open")
        .gte("starts_at", nowIso)
        .order("starts_at", { ascending: true })
        .limit(SLOT_OFFER_LIMIT),
      db
        .from("site_settings")
        .select("contact_phone, contact_address, contact_clinic_name")
        .limit(1)
        .maybeSingle(),
      db.from("services").select("title").eq("is_published", true).limit(20),
      db
        .from("whatsapp_messages")
        .select("body,direction,wa_timestamp")
        .eq("conversation_id", conversation.id)
        .order("wa_timestamp", { ascending: false })
        .limit(HISTORY_TURNS),
      loadUpcomingReservations(db, conversation.phone_number, 5, new Date(nowIso)),
      db
        .from("clinic_hours")
        .select("open_weekdays,time_windows,timezone")
        .limit(1)
        .maybeSingle(),
      // Retrieved per message rather than dumped wholesale: the prompt has a
      // budget, and an unrelated entry is a distraction the model may act on.
      searchClinicKnowledge(
        db,
        inbound.body ?? "",
        pickPatientLanguage({
          lastInboundBody: inbound.body ?? "",
          patientName: conversation.contact_name ?? "",
        }),
      ),
      heldSlotIds.length > 0
        ? db
            .from("appointment_slots")
            .select("id,starts_at")
            .in("id", heldSlotIds)
            .eq("status", "open")
            .gte("starts_at", nowIso)
        : Promise.resolve({ data: [] as { id: string; starts_at: string }[] }),
    ]);

    const clinic = clinicContactFromSettings(settingsRow);
    const apiKey = process.env.GROQ_API_KEY?.trim() ?? "";

    const outcome = await runAutoReply({
      conversationId: conversation.id,
      inboundText: inbound.body ?? "",
      policy: {
        settings,
        state,
        conversation: {
          status: conversation.status,
          last_inbound_at: conversation.last_inbound_at,
        },
        inbound: {
          message_type: inbound.message_type ?? "text",
          body: inbound.body ?? "",
        },
        counts,
        lastHumanOutboundAt: lastHuman?.wa_timestamp ?? null,
        hasAiKey: Boolean(apiKey),
      },
      prompt: {
        basePrompt: await loadPrompt(),
        // Held slots first, so the five-slot window can never push out the one
        // the patient was actually offered. Still filtered to status 'open'
        // above, so a slot someone else took is not resurrected.
        slots: [
          ...new Map(
            [
              ...((heldSlotRows ?? []) as { id: string; starts_at: string }[]),
              ...((slotRows ?? []) as { id: string; starts_at: string }[]),
            ].map((slot) => [slot.id, slot]),
          ).values(),
        ],
        clinic: {
          name: clinic.name,
          phone: clinic.phone,
          address: clinic.address,
        },
        canBook: settings.allow_booking_writes,
        hours: clinicHours as {
          open_weekdays: number[];
          time_windows: string[];
          timezone: string | null;
        } | null,
        services: (serviceRows ?? []).map((s) => ({ title: s.title as string })),
        knowledge,
        patient: {
          name: conversation.contact_name,
          known: Boolean(conversation.patient_key),
        },
        // Exactly the fields the prompt used before: patient_name is loaded for
        // quick replies and must not start appearing in the model's context.
        reservations: reservations.map(({ id, service_label, starts_at, status }) => ({
          id,
          service_label,
          starts_at,
          status,
        })),
        history: [...(history ?? [])]
          .reverse()
          .map((m) => ({
            role: m.direction === "inbound" ? ("user" as const) : ("assistant" as const),
            content: (m.body as string) ?? "",
          }))
          .filter((m) => m.content.trim()),
      },
      async chat(messages) {
        return groqChat({
          apiKey,
          temperature: 0.2,
          responseFormat: "json_object",
          maxTokens: 700,
          timeoutMs: GROQ_TIMEOUT_MS,
          attempts: 1,
          messages: messages as { role: "system" | "user" | "assistant"; content: string }[],
        });
      },
      async send(text) {
        // Mark the send as started first: a crash after this point must never
        // be retried, because Meta may already have accepted the message.
        await finishJob(db, jobId, {
          status: "queued",
          sendStartedAt: new Date().toISOString(),
        });
        const config = getKapsoConfig();
        const message = await sendWhatsappMessage({
          service: db,
          client: createKapsoClient(),
          phoneNumberId: config.phoneNumberId,
          conversationId: conversation.id,
          sentBy: null,
          text,
        });
        await db
          .from("whatsapp_messages")
          .update({ sender_kind: "ai" })
          .eq("id", message.id);
        return { id: message.id };
      },
      async draft(text) {
        // One live draft per conversation (enforced by a unique index), so
        // clear any earlier suggestion before writing this one.
        await db
          .from("whatsapp_messages")
          .delete()
          .eq("conversation_id", conversation.id)
          .eq("status", "draft");
        const message = await insertOutboundMessage(db, {
          conversationId: conversation.id,
          body: text,
          sentBy: null,
          status: "draft",
          senderKind: "ai",
          preview: text,
        });
        return { id: message.id };
      },
      async runActions(actions: BotAction[]) {
        return runBotActions(db, conversation.phone_number, actions);
      },
      async rememberOfferedSlots(slotIds) {
        await saveOfferedSlots(db, conversation.id, slotIds);
      },
      async record(event) {
        await recordAiEvent(db, {
          conversationId: conversation.id,
          jobId,
          decision: event.decision,
          reason: event.reason,
          intent: event.envelope?.intent ?? null,
          confidence: event.envelope?.confidence ?? null,
          language: event.envelope?.language ?? null,
          handoff: event.envelope?.handoff ?? false,
          injectionFlags: event.injectionFlags,
          model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
          latencyMs: event.latencyMs,
          envelope: event.envelope ?? {},
        });
      },
    });

    await finishJob(db, jobId, {
      status:
        outcome.status === "sent"
          ? "sent"
          : outcome.status === "drafted"
            ? "drafted"
            : outcome.status === "failed"
              ? "failed"
              : "skipped",
      skipReason: outcome.status === "skipped" ? outcome.reason : null,
      lastError: outcome.status === "failed" ? outcome.reason : null,
      outboundMessageId: outcome.messageId ?? null,
    });
    return outcome.status;
  } catch (err) {
    await finishJob(db, jobId, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Auto-reply failed",
    });
    return "failed";
  }
}

/** Execute the bot's booking actions through the same atomic RPCs staff use. */
async function runBotActions(
  db: ServiceClient,
  phone: string,
  actions: BotAction[],
): Promise<{ ok: boolean; message: string }> {
  for (const action of actions) {
    try {
      if (action.kind === "booking.book_slot") {
        const { error } = await db.rpc("book_open_appointment_slot", {
          p_slot_id: action.slotId!,
          p_patient_name: action.patientName ?? "WhatsApp patient",
          p_phone: phone,
          p_service_label: action.serviceLabel ?? "General consultation",
          p_notes: "Booked via WhatsApp assistant",
        });
        if (error) throw new Error(error.message);
      } else if (action.kind === "booking.reschedule") {
        const { error } = await db.rpc("reschedule_reservation_to_slot", {
          p_reservation_id: action.reservationId!,
          p_slot_id: action.slotId!,
          // The RPC re-verifies ownership by phone, so a wrong id fails there
          // too even if it slipped past decideAutoReply.
          p_phone: phone,
        });
        if (error) throw new Error(error.message);
      } else if (action.kind === "booking.cancel") {
        const { error } = await db.rpc("cancel_reservation_and_release_slot", {
          p_reservation_id: action.reservationId!,
          p_phone: phone,
        });
        if (error) throw new Error(error.message);
      }
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error && /no longer available/i.test(err.message)
            ? "Sorry — that time was just taken. A colleague will send you other options shortly."
            : "Sorry, I could not complete that. A colleague will follow up shortly.",
      };
    }
  }
  return { ok: true, message: "done" };
}

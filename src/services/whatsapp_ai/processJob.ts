import { readFile } from "node:fs/promises";
import path from "node:path";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import type { Json } from "@/lib/supabase/database.types";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { clinicContactFromSettings } from "@/lib/clinic/whatsappClinicContact";
import type { createServiceClient } from "@/lib/supabase/service";
import { aiChat, AiChatError, hasAnyAiKey } from "@/services/ai_chat";
import { addOptOut, isOptOutMessage } from "@/services/patient_notifications/optouts";
import { handleInboundImage } from "@/services/deposits/handleInboundImage";
import { depositInstructions } from "@/services/deposits/receiptMessages";
import {
  findOpenRequestByConversation,
  loadDepositSettings,
} from "@/services/deposits/store";
import { receiptMediaUrl } from "@/services/deposits/receiptMedia";
import { searchClinicKnowledge } from "@/services/clinic_knowledge/search";
import { buildHistoryTurns } from "./historyTurns";
import { readBookingState } from "./bookingState";
import { loadUpcomingReservations } from "@/services/reservations/upcomingReservations";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { insertOutboundMessage } from "@/services/whatsapp/mutations";
import { sendWhatsappMessage } from "@/services/whatsapp/sendMessage";
import { recordVisitRating } from "./visitRatings";
import { runAutoReply } from "./runAutoReply";
import { listBookableDoctorsForService } from "@/services/service_doctors/queries";
import {
  claimJob,
  countAiRepliesEver,
  countRecentAiReplies,
  finishJob,
  loadAiSettings,
  loadConversationState,
  MAX_LLM_ATTEMPTS,
  recordAiEvent,
  markHumanHandoff,
  saveBookingState,
  saveOfferedSlots,
} from "./store";
import type { BotAction } from "./schemas";

type ServiceClient = ReturnType<typeof createServiceClient>;

const HISTORY_TURNS = 20;
/** Fetched wider than the window, since drafts and empty rows are filtered out. */
const HISTORY_FETCH = 60;
const SLOT_OFFER_LIMIT = 5;
/** Below the webhook route's maxDuration, so the reply is never cut off mid-send. */
const AI_TIMEOUT_MS = 8000;
/** The whole fallback chain, still well inside the route's 60s ceiling. */
const AI_DEADLINE_MS = 40_000;

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
          .select("id,body,message_type,flow,media,raw")
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
        // No model ran: this is decided before any of them is called.
        model: null,
        latencyMs: 0,
        envelope: {},
      });
      await finishJob(db, jobId, { status: "skipped", skipReason: "opted_out_keyword" });
      return "opted_out";
    }

    // A screenshot answering a deposit we are waiting on is not a question for
    // the model. Handled here, before the policy gate that would otherwise
    // dismiss every image as unreadable — and handleInboundImage returns
    // `handled: false` for anything else, so an ordinary photo behaves exactly
    // as it did before deposits existed.
    const receipt = await handleInboundImage(
      { db },
      {
        conversationId: conversation.id,
        messageId: inbound.id,
        messageType: inbound.message_type,
        mediaUrl: receiptMediaUrl(inbound.media, inbound.raw),
        language: pickPatientLanguage({
          lastInboundBody: inbound.body ?? "",
          patientName: conversation.contact_name ?? "",
        }),
      },
    ).catch((err) => {
      // Never let the deposit path break an ordinary reply: fall through to the
      // assistant, which is what would have happened without this feature.
      console.error("deposit receipt handling failed", err);
      return { handled: false } as const;
    });

    if (receipt.handled) {
      // Written before the send, like every other outbound path here: a crash
      // afterwards must not be retried, because Meta may already have it.
      await finishJob(db, jobId, {
        status: "queued",
        sendStartedAt: new Date().toISOString(),
      });
      try {
        const config = getKapsoConfig();
        await sendWhatsappMessage({
          service: db,
          client: createKapsoClient(),
          phoneNumberId: config.phoneNumberId,
          conversationId: conversation.id,
          sentBy: null,
          // "system", not "ai": this is the clinic's own bookkeeping talking,
          // so it must not spend the assistant's reply budget or trip the
          // human_active gate for the next message.
          senderKind: "system",
          text: receipt.replyText,
        });
      } catch (err) {
        console.error("deposit receipt reply failed to send", err);
      }
      await recordAiEvent(db, {
        conversationId: conversation.id,
        jobId,
        decision: "skip",
        reason: `deposit_${receipt.outcome}:${receipt.reason}`,
        intent: null,
        confidence: null,
        language: null,
        handoff: false,
        injectionFlags: [],
        model: null,
        latencyMs: 0,
        envelope: {},
      });
      await finishJob(db, jobId, { status: "sent" });
      return `deposit_${receipt.outcome}`;
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

    // Read once, ahead of the parallel batch below, purely to scope the open
    // slots query to whichever doctor the booking already settled on — the
    // slot the patient taps is what decides the doctor on the RPC side (see
    // runBotActions), so a slot outside this list would silently book the
    // wrong doctor rather than the one they actually chose. Doctor-less
    // (unset, or "no preference" not yet resolved) means every open slot, the
    // same as before doctors existed.
    const priorBookingState = readBookingState(state, new Date());

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
      aiRepliesEver,
      { data: recentEvents },
      knowledge,
      { data: heldSlotRows },
      depositSettings,
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
      (() => {
        let query = db
          .from("appointment_slots")
          .select("id,starts_at")
          .eq("status", "open")
          .gte("starts_at", nowIso);
        if (priorBookingState.pending.doctorId) {
          query = query.eq("doctor_id", priorBookingState.pending.doctorId);
        }
        return query.order("starts_at", { ascending: true }).limit(SLOT_OFFER_LIMIT);
      })(),
      db
        .from("site_settings")
        .select("contact_phone, contact_address, contact_clinic_name")
        .limit(1)
        .maybeSingle(),
      // Same filter, same order as the public website's own services query
      // (src/services/portfolio/queries.ts) — deleted_at matters, without it
      // the model was shown soft-deleted agency leftovers ("Brand",
      // "Campaign") beside the real dental services. Ordered by sort_order so
      // the assistant lists services the same way the site does, not in
      // whatever order the database happens to return them.
      db
        .from("services")
        .select("id,title,title_ar,price_label")
        .eq("is_published", true)
        .is("deleted_at", null)
        .order("sort_order")
        .limit(30),
      db
        .from("whatsapp_messages")
        .select("id,body,direction,status,sender_kind,wa_timestamp")
        .eq("conversation_id", conversation.id)
        .order("wa_timestamp", { ascending: false })
        .order("id", { ascending: false })
        .limit(HISTORY_FETCH),
      loadUpcomingReservations(db, conversation.phone_number, 5, new Date(nowIso)),
      db
        .from("clinic_hours")
        .select("open_weekdays,time_windows,timezone")
        .limit(1)
        .maybeSingle(),
      // Has the assistant ever spoken here? Decides the one-time disclosure.
      // Counted through a helper because `status = 'sent'` was wrong: a message
      // moves on to 'delivered' and 'read', so this counted nothing and the
      // assistant introduced itself on every single reply.
      countAiRepliesEver(db, conversation.id),
      db
        .from("whatsapp_ai_events")
        .select("decision,handoff")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(3),
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
      // Never lets a deposit lookup break a reply: no settings simply means
      // the assistant has no price to quote.
      loadDepositSettings(db).catch(() => null)
    ]);

    // Consecutive rough turns, newest first: a draft or a handoff means the
    // assistant did not resolve that turn on its own.
    let recentStruggles = 0;
    for (const event of recentEvents ?? []) {
      if (event.handoff || event.decision === "draft") recentStruggles += 1;
      else break;
    }

    const clinic = clinicContactFromSettings(settingsRow);
    // Which model answered is decided at call time by the fallback chain, so
    // the event row has to record what actually ran, not what we hoped would.
    let usedModel = "";

    // The booking flow only ever knows a service by its free-text label
    // (bookingState.ts's PendingBooking.service, unchanged since before
    // doctors existed — see the Stage 2 plan for why this was kept simple
    // rather than threading real service ids through every button id and
    // model-reported field). This is the one place that label gets resolved
    // back to a real id, so eligibility can be looked up. A label the model
    // paraphrased into something not matching any row falls back to
    // serviceId null — "any bookable doctor" — the same safe default
    // list_bookable_doctors_for_service already uses for an unmapped
    // service, not a crash or an empty list.
    const serviceIdByLabel = new Map<string, string>();
    for (const row of serviceRows ?? []) {
      if (row.title) serviceIdByLabel.set(row.title, row.id);
      if (row.title_ar) serviceIdByLabel.set(row.title_ar, row.id);
    }

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
        hasAiKey: hasAnyAiKey(),
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
        // The same predicate the public website uses to decide a title is
        // real rather than a placeholder — imported, not re-derived, so this
        // list can never quietly drift from what the site itself shows.
        services: (serviceRows ?? [])
          .filter((s) => hasVisibleServiceTitle(s.title as string))
          .map((s) => ({
            title: s.title as string,
            title_ar: (s.title_ar as string) || null,
            price: (s.price_label as string) || null,
          })),
        // The clinic's own deposit, so "how much?" has an honest answer instead
        // of a dead end. It is the only money figure the assistant may state,
        // and only as a deposit — the guard in runAutoReply enforces both.
        deposit:
          depositSettings?.enabled && Number(depositSettings.amount_egp) > 0
            ? {
                amountEgp: Number(depositSettings.amount_egp),
                currency: depositSettings.currency || "EGP",
              }
            : null,
        knowledge,
        // No patient-name field is passed here on purpose. WhatsApp's own
        // display name used to be treated as the patient's real name once
        // patient_key or contact_name was set — but a profile name is
        // self-chosen, often a nickname, and not infrequently someone else's
        // (a parent booking for a child on a shared phone). The clinic wants
        // the patient's name confirmed by the patient, every booking, not
        // inferred from WhatsApp metadata; buildAutoReplyPrompt now always
        // asks, and the only way a name becomes settled is `collected` once
        // the patient actually gives one in the conversation.
        reservations: reservations.map(
          ({ id, service_label, starts_at, status, doctor_id, doctor_name }) => ({
            id,
            service_label,
            starts_at,
            status,
            doctor_id,
            doctor_name,
          }),
        ),
        history: buildHistoryTurns(history ?? [], HISTORY_TURNS),
      },
      async chat(messages) {
        const request = {
          temperature: 0.2,
          // The chain's first models reason before answering, and that
          // reasoning is spent from the same budget. At 700 the JSON was being
          // cut off mid-object — "confidence": and nothing after it — which
          // reaches the patient as a parse failure and a silent draft.
          // Headroom, not a diagnosis: a production reply came back cut off
          // mid-word well under this ceiling. Truncation now fails the model so
          // the chain moves on, and a bigger budget makes it less likely at all.
          maxTokens: 2400,
          timeoutMs: AI_TIMEOUT_MS,
          deadlineMs: AI_DEADLINE_MS,
          messages: messages as { role: "system" | "user" | "assistant"; content: string }[],
        };
        try {
          const result = await aiChat({ ...request, responseFormat: "json_object" });
          usedModel = `${result.provider}:${result.model}`;
          return result.content;
        } catch (err) {
          // A provider rejects the entire completion when the model answers in
          // prose instead of JSON, and retrying the same model in the same mode
          // only repeats it — which left the patient with silence. Ask the chain
          // once more without JSON mode (the extractor copes with fenced or
          // wrapped JSON), and fall back to what the model actually wrote, which
          // at worst becomes a draft a human can use.
          if (!(err instanceof AiChatError) || !err.jsonValidateFailed) throw err;
          try {
            const retry = await aiChat(request);
            usedModel = `${retry.provider}:${retry.model}`;
            return retry.content;
          } catch {
            if (err.failedGeneration) return err.failedGeneration;
            throw err;
          }
        }
      },
      async send(text, ui) {
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
          buttons: ui?.kind === "buttons" ? ui.buttons : undefined,
          list: ui?.kind === "list" ? { button: ui.button, rows: ui.rows } : undefined,
        });
        await db
          .from("whatsapp_messages")
          .update({ sender_kind: "ai" })
          .eq("id", message.id);
        return { id: message.id };
      },
      async draft(text, _reason, ui) {
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
          // Kept with the draft so approving it sends what the assistant
          // actually composed. Without this the choices vanish at approval and
          // Draft mode quietly delivers a worse message than Auto mode.
          flow: !ui
            ? null
            : ui.kind === "buttons"
              ? { kind: "buttons" as const, title: "Quick replies", buttons: ui.buttons }
              : {
                  kind: "list" as const,
                  title: ui.button,
                  buttons: ui.rows.map(({ id, title }) => ({ id, title })),
                  rows: ui.rows,
                },
        });
        return { id: message.id };
      },
      async runActions(actions: BotAction[]) {
        return runBotActions(db, conversation.phone_number, actions, {
          conversationId: conversation.id,
          language: pickPatientLanguage({
            lastInboundBody: inbound.body ?? "",
            patientName: conversation.contact_name ?? "",
          }),
        });
      },
      isFirstAiReply: aiRepliesEver === 0,
      // What the patient tapped, if they tapped. The id is ours; the title is
      // what they saw. Both go to the server's own reading of the choice.
      tap: {
        buttonId:
          (inbound.flow as { buttonId?: string } | null)?.buttonId ?? null,
        title: inbound.body ?? "",
      },
      recentStruggles,
      async requestHuman(reason) {
        await markHumanHandoff(db, conversation.id, settings.human_handoff_minutes);
        await db.from("whatsapp_notes").insert({
          conversation_id: conversation.id,
          body:
            reason === "keyword"
              ? "Patient asked to speak to a person. The assistant has stepped back."
              : `Assistant handed over (${reason}).`,
          pinned: false,
          author: "Assistant",
        });
      },
      async rememberOfferedSlots(slotIds) {
        await saveOfferedSlots(db, conversation.id, slotIds);
      },
      async listEligibleDoctors(serviceLabel) {
        const serviceId = serviceIdByLabel.get(serviceLabel) ?? null;
        const doctors = await listBookableDoctorsForService(db, {
          serviceId,
          fromIso: new Date().toISOString(),
        });
        return doctors.map((d) => ({
          id: d.id,
          name: d.displayName ?? d.id,
          specialty: d.specialty,
          nextSlotStartsAt: d.nextSlot?.startsAt ?? null,
        }));
      },
      // An expired or corrupt row reads as a fresh start, so an abandoned
      // booking from an hour ago is never resumed as if it were live.
      bookingState: priorBookingState,
      async saveBookingState(next) {
        await saveBookingState(db, conversation.id, next);
      },
      async record(event) {
        // A score, when the patient gave one. Best-effort and after the fact:
        // they have already been answered, and a rating is never worth failing
        // a reply over.
        await recordVisitRating(db, {
          conversationId: conversation.id,
          reservationId: reservations[0]?.id ?? null,
          messageId: inbound.id,
          phone: conversation.phone_number,
          rating: event.envelope?.rating ?? null,
          comment: inbound.body ?? "",
        }).catch(() => false);

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
          model: usedModel || null,
          latencyMs: event.latencyMs,
          // Keep the model's own output when it could not be parsed: without it
          // a schema failure is undiagnosable after the fact.
          envelope: {
            ...((event.envelope ?? {}) as Record<string, unknown>),
            ...(event.rawOutput
              ? { raw_output: event.rawOutput, fallback_reason: event.fallbackReason }
              : {}),
          },
        });
      },
    });

    const decided = decideJobFinish(outcome.status, job.attempts ?? 0);
    await finishJob(db, jobId, {
      status: decided.status,
      skipReason: outcome.status === "skipped" ? outcome.reason : null,
      lastError: outcome.status === "failed" ? outcome.reason : null,
      outboundMessageId: outcome.messageId ?? null,
      attempts: decided.attempts,
    });
    return decided.status === "queued" ? "requeued" : outcome.status;
  } catch (err) {
    await finishJob(db, jobId, {
      status: "failed",
      lastError: err instanceof Error ? err.message : "Auto-reply failed",
    });
    return "failed";
  }
}

/**
 * The reservation's free-text notes for a new booking.
 *
 * There is no age or medical-history column on reservations -- this is
 * intentionally free text the dentist reads before the visit, not a
 * structured field the rest of the app queries or exports. Age and medical
 * info are patient-reported and appended only when given; the assistant never
 * comments on or reacts to what is recorded here.
 */
/**
 * What a finished run does to the job row.
 *
 * A "failed" outcome from runAutoReply means the whole model chain refused to
 * answer — every provider was out of quota or down at once. That is usually
 * transient (quotas renew by the minute or the day), so it is re-queued for
 * the sweeper to pick up rather than left terminal: a job finished as "failed"
 * is invisible to the sweeper forever — it only ever looks for "queued" or
 * "running" — so a saturated chain used to leave the patient with permanent,
 * silent nothing: no reply, no draft, and nothing that would ever retry it.
 * Found by testing hard enough to actually exhaust the chain, which a handful
 * of patients messaging in the same short window can do for real.
 *
 * Pure, so the retry/give-up boundary is table-tested without faking the rest
 * of a job's database reads.
 */
export function decideJobFinish(
  outcome: "sent" | "drafted" | "skipped" | "failed",
  currentAttempts: number,
): { status: "sent" | "drafted" | "skipped" | "failed" | "queued"; attempts?: number } {
  if (outcome !== "failed") return { status: outcome };
  const attempts = currentAttempts + 1;
  if (attempts < MAX_LLM_ATTEMPTS) return { status: "queued", attempts };
  return { status: "failed", attempts };
}

function bookingNotes(action: BotAction): string {
  const parts = ["Booked via WhatsApp assistant"];
  if (action.age) parts.push(`Age: ${action.age}`);
  if (action.medicalInfo) parts.push(`Medical history: ${action.medicalInfo}`);
  return parts.join(" | ");
}

/** Execute the bot's booking actions through the same atomic RPCs staff use. */
export async function runBotActions(
  db: ServiceClient,
  phone: string,
  actions: BotAction[],
  context?: { conversationId: string; language: "ar" | "en" },
): Promise<{ ok: boolean; message: string; append?: string }> {
  let append: string | undefined;

  for (const action of actions) {
    try {
      if (action.kind === "booking.book_slot") {
        // When a deposit is required the slot is held rather than booked, and
        // the patient is told what to transfer. Same locking discipline as the
        // ordinary path; a separate function because a defaulted argument on
        // the original would make PostgREST's overload resolution ambiguous.
        const hold = context ? await openDepositHold(db, context.conversationId) : null;
        if (hold) {
          const { error } = await db.rpc("book_slot_with_deposit_hold", {
            p_slot_id: action.slotId!,
            p_patient_name: action.patientName ?? "WhatsApp patient",
            p_phone: phone,
            p_service_label: action.serviceLabel ?? "General consultation",
            p_notes: bookingNotes(action),
            p_conversation_id: context!.conversationId,
            p_amount_egp: hold.amountEgp,
            p_hold_minutes: hold.holdMinutes,
            p_settings: hold.snapshot,
          });
          if (error) throw new Error(error.message);
          append = depositInstructions({
            amountEgp: hold.amountEgp,
            instapayHandle: hold.instapayHandle,
            walletNumber: hold.walletNumber,
            holdMinutes: hold.holdMinutes,
            language: context!.language,
          });
        } else {
          const { error } = await db.rpc("book_open_appointment_slot", {
            p_slot_id: action.slotId!,
            p_patient_name: action.patientName ?? "WhatsApp patient",
            p_phone: phone,
            p_service_label: action.serviceLabel ?? "General consultation",
            p_notes: bookingNotes(action),
          });
          if (error) throw new Error(error.message);
        }
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
  return { ok: true, message: "done", ...(append ? { append } : {}) };
}

/**
 * Whether this booking should be held for a deposit, and on what terms.
 *
 * Null — book normally — whenever deposits are off, unconfigured, or the
 * settings row is missing. A misconfigured deposit must never stop a patient
 * booking; it just does not ask them for money.
 */
async function openDepositHold(
  db: ServiceClient,
  conversationId: string,
): Promise<
  | {
      amountEgp: number;
      holdMinutes: number;
      instapayHandle: string;
      walletNumber: string;
      snapshot: Json;
    }
  | null
> {
  const settings = await loadDepositSettings(db).catch(() => null);
  if (!settings?.enabled) return null;

  const amountEgp = Number(settings.amount_egp);
  if (!Number.isFinite(amountEgp) || amountEgp <= 0) return null;

  // Nowhere to send the money is not a deposit, it is a dead end.
  const instapayHandle = settings.instapay_handle.trim();
  const walletNumber = settings.wallet_number.trim();
  if (!instapayHandle && !walletNumber) return null;

  // One live deposit per conversation is a database constraint, so asking for a
  // second would fail the booking itself. Book normally instead.
  const existing = await findOpenRequestByConversation(db, conversationId).catch(() => null);
  if (existing) return null;

  return {
    amountEgp,
    holdMinutes: settings.hold_minutes,
    instapayHandle,
    walletNumber,
    // What the patient is about to be told, kept so a later Settings edit
    // cannot invalidate money already sent to the old account.
    snapshot: {
      amount_egp: amountEgp,
      instapay_handle: instapayHandle,
      wallet_number: walletNumber,
      recipient_names: settings.recipient_names ?? [],
      hold_minutes: settings.hold_minutes,
    } as Json,
  };
}

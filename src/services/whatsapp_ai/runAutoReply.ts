import {
  applyTap,
  nextBookingState,
  type BookingState,
  type TapChoice,
} from "./bookingState";
import { replyUi, type ReplyUi } from "./bookingButtons";
import { buildAutoReplyPrompt, type BuildPromptInput } from "./buildAutoReplyPrompt";
import { decideAutoReply } from "./decideAutoReply";
import { extractAutoReplyEnvelope } from "./extractAutoReplyEnvelope";
import { withDisclosure, withHumanOffer, handoffAck } from "./disclosure";
import { showsFrustration, wantsHuman } from "./humanRequest";
import { injectionHeuristics } from "./injectionHeuristics";
import { evaluateAutoReplyPolicy, type PolicyInput } from "./policy";
import {
  claimsCompletedBooking,
  isSendableReply,
  stripInternalIds,
} from "./replyGuards";
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
  send: (text: string, ui?: ReplyUi) => Promise<{ id: string }>;
  draft: (text: string, reason: string, ui?: ReplyUi) => Promise<{ id: string }>;
  runActions: (actions: BotAction[]) => Promise<{ ok: boolean; message: string }>;
  rememberOfferedSlots: (slotIds: string[]) => Promise<void>;
  /** Hand the thread to a colleague, and tell them why. */
  requestHuman?: (reason: string) => Promise<void>;
  /** True when the assistant has never spoken in this conversation. */
  isFirstAiReply?: boolean;
  /** Consecutive turns that went badly, used to offer a person unprompted. */
  recentStruggles?: number;
  /** Booking progress carried between turns. Absent means a fresh start. */
  bookingState?: BookingState | null;
  /** The button this message came from, if the patient tapped rather than typed. */
  tap?: TapChoice | null;
  saveBookingState?: (state: BookingState) => Promise<void>;
  record: (event: {
    decision: "auto_send" | "draft" | "skip" | "error";
    reason: string;
    envelope?: AutoReplyEnvelope;
    injectionFlags: string[];
    latencyMs: number;
    /** The model's own output, kept only when it could not be parsed. */
    rawOutput?: string;
    fallbackReason?: string;
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

  // A patient asking for a person gets one, before any model call. Answering
  // them with a bot is the one response that cannot be right.
  if (wantsHuman(deps.inboundText)) {
    await deps.requestHuman?.("keyword");
    const ack = handoffAck(inboundLanguage(deps.inboundText));
    const { id } =
      gate.allow === "auto"
        ? await deps.send(ack)
        : await deps.draft(ack, "human_requested");
    await deps.record({
      decision: gate.allow === "auto" ? "auto_send" : "draft",
      reason: "human_requested",
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
    });
    return {
      status: gate.allow === "auto" ? "sent" : "drafted",
      reason: "human_requested",
      messageId: id,
    };
  }

  const now = deps.now?.() ?? new Date();

  // A tap is recorded before the model is asked anything. We put the id on the
  // button, so what it meant is not a question — and the model is then told the
  // choice is settled rather than left to infer it from the words.
  const tapped = applyTap(deps.bookingState ?? null, deps.tap, deps.prompt.slots, now);

  const built = buildAutoReplyPrompt({
    ...deps.prompt,
    collected: tapped.pending,
  });

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

  const { envelope: rawEnvelope, fallbackReason } = extractAutoReplyEnvelope(raw);

  // Internal identifiers must never reach a patient. The model is shown slots
  // as `slotId=<uuid>` and told to copy the id exactly — meaning into the
  // structured field — and it has been observed copying them into the prose
  // too. The prompt asks; this enforces.
  const guarded = stripInternalIds(rawEnvelope.reply);
  const envelope = { ...rawEnvelope, reply: guarded.reply };

  // Record what the patient told us before deciding anything about the reply.
  // It is true whether or not the reply goes out, and losing it is how the
  // assistant asked for a service one turn after being told it.
  let booking = nextBookingState(tapped, {
    intent: envelope.intent,
    collected: envelope.collected,
    offeredSlots: deps.prompt.slots,
    bookingCompleted: false,
    now,
  });
  if (!sameBooking(deps.bookingState, booking)) {
    await deps.saveBookingState?.(booking);
  }

  // A booking action may omit details the patient already gave on an earlier
  // turn ("yes, book it"). Fill them from what is settled; decideAutoReply still
  // requires any slot to be one the server offered.
  const actionEnvelope = {
    ...envelope,
    actions: envelope.actions.map((action) => ({
      ...action,
      slotId:
        action.slotId ??
        (action.kind === "booking.cancel" ? undefined : booking.pending.slotId),
      serviceLabel: action.serviceLabel ?? booking.pending.service,
      patientName: action.patientName ?? booking.pending.patientName,
    })),
  };
  if (guarded.violations.length > 0 && !isSendableReply(envelope.reply)) {
    // Nothing meaningful survived the strip — a human should write this one.
    const { id } = await deps.draft(rawEnvelope.reply, "reply_was_all_ids");
    await deps.record({
      decision: "draft",
      reason: "reply_was_all_ids",
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
      ...(fallbackReason ? { rawOutput: raw, fallbackReason } : {}),
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
    envelope: actionEnvelope,
    injectionFlags: flags,
    offeredSlotIds: built.offeredSlotIds,
    ownReservationIds: deps.prompt.reservations.map((r) => r.id),
    allowBookingWrites: deps.policy.settings.allow_booking_writes,
    // Carrying the thread is about not bowing out of a conversation. It is not
    // a reason to send a reply we could not even parse: that is a failure in
    // our own machinery, and the fallback text says nothing worth sending.
    fullConversation: deps.policy.settings.full_conversation && !fallbackReason,
  });

  // The context gate can veto the content gate, never the other way round.
  const finalAction = gate.allow === "draft" ? "draft" : decision.action;
  const reason = gate.allow === "draft" ? gate.reason : decision.reason;

  // Say who is speaking on the first reply, and offer a person when the
  // conversation has been going badly.
  const struggles =
    (deps.recentStruggles ?? 0) + (showsFrustration(deps.inboundText) ? 1 : 0);
  const introduced = withDisclosure(
    envelope.reply,
    envelope.language,
    deps.isFirstAiReply ?? false,
  );
  // Carrying the thread means not volunteering to leave it. The patient can
  // still ask for a person at any time, and that is handled before the model.
  const outgoing = deps.policy.settings.full_conversation
    ? introduced
    : withHumanOffer(introduced, envelope.language, struggles);

  // Tappable times, a confirm pair, or the service list — all built from what
  // the server knows, never from what the model wrote. A tappable thing is an
  // action, and this model has been caught putting slot ids where patients
  // could read them.
  const ui =
    replyUi({
      language: envelope.language,
      offeredSlots: deps.prompt.slots.filter(
        (slot) =>
          envelope.offeredSlotIds.includes(slot.id) &&
          built.offeredSlotIds.includes(slot.id),
      ),
      services: deps.prompt.services,
      pendingSlotId: booking.pending.slotId,
      pendingService: booking.pending.service,
      // If it is going to ask which service, it asks in taps — including a way
      // to say "I do not know", which is the whole point of it being optional.
      askingService: envelope.needs.includes("service"),
      choices: envelope.choices,
      canBook: deps.policy.settings.allow_booking_writes,
      willExecuteAction: decision.actions.length > 0,
    }) ?? undefined;

  if (finalAction === "draft") {
    const { id } = await deps.draft(outgoing, reason, ui);
    await deps.record({
      decision: "draft",
      reason,
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
      ...(fallbackReason ? { rawOutput: raw, fallbackReason } : {}),
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
    // The booking really happened: nothing is pending any more.
    booking = nextBookingState(booking, {
      collected: {},
      offeredSlots: deps.prompt.slots,
      bookingCompleted: true,
      now,
    });
    await deps.saveBookingState?.(booking);
  }

  // Last gate before a patient reads it: the reply may not assert a booking
  // change that did not happen. The model wrote "حجزت لك موعد" to a real
  // patient while booking writes were disabled, and nothing had been written.
  // Executed actions are the only thing that makes such a claim true.
  if (decision.actions.length === 0 && claimsCompletedBooking(envelope.reply)) {
    const { id } = await deps.draft(envelope.reply, "false_confirmation");
    await deps.record({
      decision: "draft",
      reason: "false_confirmation",
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
      ...(fallbackReason ? { rawOutput: raw, fallbackReason } : {}),
    });
    return {
      status: "drafted",
      reason: "false_confirmation",
      messageId: id,
      envelope,
    };
  }

  const { id } = await deps.send(outgoing, ui);
  await deps.record({
    decision: "auto_send",
    reason,
    envelope,
    injectionFlags: flags,
    latencyMs: Date.now() - startedAt,
  });
  return { status: "sent", reason, messageId: id, envelope };
}

function sameBooking(
  before: BookingState | null | undefined,
  after: BookingState,
): boolean {
  return (
    (before?.step ?? "idle") === after.step &&
    JSON.stringify(before?.pending ?? {}) === JSON.stringify(after.pending)
  );
}

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

/** Enough to answer a handoff in the right language without a model call. */
function inboundLanguage(text: string): "ar" | "en" {
  return ARABIC_SCRIPT.test(text) ? "ar" : "en";
}

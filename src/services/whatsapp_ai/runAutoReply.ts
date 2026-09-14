import {
  applyTap,
  nextBookingState,
  type BookingState,
  type OfferedDoctor,
  type TapChoice,
} from "./bookingState";
import { replyUi, type ButtonDoctor, type ReplyUi } from "./bookingButtons";
import { buildAutoReplyPrompt, type BuildPromptInput } from "./buildAutoReplyPrompt";
import { decideAutoReply } from "./decideAutoReply";
import { extractAutoReplyEnvelope } from "./extractAutoReplyEnvelope";
import { withDisclosure, withHumanOffer, handoffAck } from "./disclosure";
import { showsFrustration, wantsHuman } from "./humanRequest";
import { injectionHeuristics } from "./injectionHeuristics";
import { evaluateAutoReplyPolicy, type PolicyInput } from "./policy";
import {
  claimsCompletedBooking,
  quotesMoney,
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
  runActions: (actions: BotAction[]) => Promise<{
    ok: boolean;
    message: string;
    /** Server-composed text to add to the reply, e.g. deposit instructions. */
    append?: string;
  }>;
  rememberOfferedSlots: (slotIds: string[]) => Promise<void>;
  /**
   * Doctors eligible for a service label, soonest-available first — the one
   * DB call the pure booking-state machine can't make itself. `null`/empty
   * label means "no service known yet" and should resolve to every bookable
   * doctor (mirrors list_bookable_doctors_for_service's own NULL default).
   */
  listEligibleDoctors: (serviceLabel: string) => Promise<ButtonDoctor[]>;
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

  // Doctors eligible under the *prior* turn's service — a doctor:<uuid> tap
  // can only have come from a list the previous reply actually showed, so
  // that is what it has to be checked against, not whatever the service
  // turns out to be after this turn's tap/report is folded in.
  const priorService = deps.bookingState?.pending.service;
  const doctorsForTap: ButtonDoctor[] = priorService
    ? await deps.listEligibleDoctors(priorService)
    : [];

  // A tap is recorded before the model is asked anything. We put the id on the
  // button, so what it meant is not a question — and the model is then told the
  // choice is settled rather than left to infer it from the words.
  const tapped = applyTap(
    deps.bookingState ?? null,
    deps.tap,
    deps.prompt.slots,
    now,
    doctorsForTap,
  );

  // Doctors eligible under the service as of right now — after the tap, but
  // before the model runs. Reused below for nextBookingState's own
  // validation and, when the model doesn't change the service this turn,
  // for the reply the patient actually sees — refetched only if it does.
  const doctorsForPrompt: ButtonDoctor[] =
    tapped.pending.service === priorService
      ? doctorsForTap
      : tapped.pending.service
        ? await deps.listEligibleDoctors(tapped.pending.service)
        : [];

  const built = buildAutoReplyPrompt({
    ...deps.prompt,
    collected: tapped.pending,
    doctors: doctorsForPrompt.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      nextSlotStartsAt: d.nextSlotStartsAt,
    })),
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

  // The doctor already on the reservation being moved, when there is exactly
  // one and it is unambiguous — see nextBookingState's own doc comment for
  // why this only ever seeds a default, never overrides an explicit choice.
  const activeReservationDoctor: OfferedDoctor | null =
    deps.prompt.reservations.length === 1 && deps.prompt.reservations[0].doctor_id
      ? {
          id: deps.prompt.reservations[0].doctor_id,
          name: deps.prompt.reservations[0].doctor_name ?? "",
        }
      : null;

  // Record what the patient told us before deciding anything about the reply.
  // It is true whether or not the reply goes out, and losing it is how the
  // assistant asked for a service one turn after being told it.
  let booking = nextBookingState(tapped, {
    intent: envelope.intent,
    collected: envelope.collected,
    offeredSlots: deps.prompt.slots,
    offeredDoctors: doctorsForPrompt,
    activeReservationDoctor,
    bookingCompleted: false,
    now,
  });

  // Doctors eligible under the service as it stands *after* this turn — only
  // worth a second fetch when the model just changed the service itself
  // (free text, not a tap); otherwise doctorsForPrompt is still current.
  // This is what the reply the patient is about to receive is built from, so
  // it can never show a doctor list one message behind what was just said.
  const doctorsForReply: ButtonDoctor[] =
    booking.pending.service === tapped.pending.service
      ? doctorsForPrompt
      : booking.pending.service
        ? await deps.listEligibleDoctors(booking.pending.service)
        : [];

  // Nothing to choose between — skip the question entirely rather than make
  // the patient tap through a list of one, and say straight through to
  // offering times.
  if (
    booking.pending.service &&
    !booking.pending.doctorId &&
    doctorsForReply.length === 1
  ) {
    const only = doctorsForReply[0];
    booking = nextBookingState(booking, {
      collected: { doctorId: only.id },
      offeredSlots: deps.prompt.slots,
      offeredDoctors: doctorsForReply,
      bookingCompleted: false,
      now,
    });
  }

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
      age: action.age ?? booking.pending.age,
      medicalInfo: action.medicalInfo ?? booking.pending.medicalInfo,
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
  let outgoing = deps.policy.settings.full_conversation
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
      pendingDoctorId: booking.pending.doctorId,
      doctors: doctorsForReply,
      // A reschedule seeds the reservation's own doctor without the patient
      // ever picking it, so — unlike a fresh booking's settled choice — the
      // model is trusted to reopen this one question via needs.
      allowDoctorReselect: envelope.intent === "booking_reschedule",
      // What it says it is waiting for decides what may be tapped — including
      // showing nothing at all when the answer has to be typed out.
      needs: envelope.needs,
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
    // Facts the server must state itself, appended rather than asked of the
    // model: an amount or a payment address it invented would send a patient's
    // money to the wrong place.
    if (result.append) outgoing = `${outgoing}\n\n${result.append}`;
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

  // Money is the one subject the assistant has no data for: there is no price
  // on a service row, so any figure it produces was invented, and a patient
  // acts on a quoted price. The prompt sends every money question to a person;
  // this is what makes that true. The deposit amount is unaffected — the server
  // composes it and appends it below, which is why it is checked here against
  // the model's own words rather than the outgoing text.
  // Reads the same figure the prompt was given, so the two can never disagree
  // about which amount is allowed through.
  if (quotesMoney(envelope.reply, { depositEgp: deps.prompt.deposit?.amountEgp ?? null })) {
    const { id } = await deps.draft(envelope.reply, "price_claim");
    await deps.record({
      decision: "draft",
      reason: "price_claim",
      envelope,
      injectionFlags: flags,
      latencyMs: Date.now() - startedAt,
      ...(fallbackReason ? { rawOutput: raw, fallbackReason } : {}),
    });
    return { status: "drafted", reason: "price_claim", messageId: id, envelope };
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

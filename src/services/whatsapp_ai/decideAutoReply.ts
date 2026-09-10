import type { AutoReplyEnvelope, AutoReplyIntent } from "./schemas";

export type ReplyDecision = {
  action: "auto_send" | "draft";
  reason: string;
  /** Actions cleared to run. Empty unless the intent and ids both check out. */
  actions: AutoReplyEnvelope["actions"];
};

/**
 * Minimum confidence per intent, and which intents may ever be answered
 * without a human.
 *
 * Absent from this map means "never auto-send": clinical_question, complaint,
 * emergency and other are answered by a person, whatever the model's
 * confidence. That is the whole point of the hybrid design — an LLM's stated
 * confidence is not calibrated, and a wrong clinical answer to a patient is
 * not a recoverable error.
 */
const AUTO_SEND_THRESHOLDS: Partial<Record<AutoReplyIntent, number>> = {
  greeting: 0.7,
  hours: 0.7,
  location: 0.7,
  directions: 0.7,
  services: 0.7,
  pricing: 0.8,
  booking_availability: 0.8,
  booking_confirm: 0.8,
  booking_request: 0.85,
  booking_reschedule: 0.85,
  // Higher than booking or rescheduling on purpose. Cancelling is asymmetric:
  // a wrong booking is visible and reversible, a wrong cancel silently frees a
  // slot that the next caller takes.
  booking_cancel: 0.9,
};

/** Intents whose actions write to the database. */
const WRITE_INTENTS = new Set<AutoReplyIntent>([
  "booking_request",
  "booking_reschedule",
  "booking_cancel",
]);

export type DecideInput = {
  envelope: AutoReplyEnvelope;
  injectionFlags: string[];
  /** Slot ids the server actually offered last turn. */
  offeredSlotIds: string[];
  /** Reservation ids belonging to this phone number. */
  ownReservationIds: string[];
  allowBookingWrites: boolean;
};

/**
 * Decide whether the model's reply may be sent, given everything the server
 * knows. Pure, so the whole matrix is exhaustively testable.
 *
 * Runs *after* evaluateAutoReplyPolicy has already allowed "auto" — this layer
 * judges the content, that one judges the context.
 */
export function decideAutoReply(input: DecideInput): ReplyDecision {
  const { envelope } = input;
  const draft = (reason: string): ReplyDecision => ({
    action: "draft",
    reason,
    actions: [],
  });

  // The model asked for a human, or the message was addressed to the model
  // rather than the clinic.
  if (envelope.handoff) return draft(envelope.handoffReason || "model_handoff");
  if (input.injectionFlags.length > 0) return draft("injection");

  const threshold = AUTO_SEND_THRESHOLDS[envelope.intent];
  if (threshold === undefined) return draft(`intent_${envelope.intent}`);
  if (envelope.confidence < threshold) return draft("low_confidence");

  // A reply that still needs information cannot be a final answer.
  if (envelope.needs.length > 0 && !WRITE_INTENTS.has(envelope.intent)) {
    // Asking one clarifying question is fine for non-write intents.
    return { action: "auto_send", reason: "clarifying", actions: [] };
  }

  if (envelope.actions.length === 0) {
    if (WRITE_INTENTS.has(envelope.intent)) {
      // Wants to book but named no action: it is still gathering details.
      return { action: "auto_send", reason: "collecting", actions: [] };
    }
    return { action: "auto_send", reason: "informational", actions: [] };
  }

  // From here on the model wants to write.
  if (!input.allowBookingWrites) return draft("booking_writes_disabled");

  for (const action of envelope.actions) {
    if (action.kind === "booking.book_slot") {
      // Only a slot the server itself offered this turn. Otherwise a guessed
      // or injected uuid could book over something else.
      if (!action.slotId || !input.offeredSlotIds.includes(action.slotId)) {
        return draft("slot_not_offered");
      }
    }
    if (action.kind === "booking.reschedule") {
      if (!action.slotId || !input.offeredSlotIds.includes(action.slotId)) {
        return draft("slot_not_offered");
      }
      if (
        !action.reservationId ||
        !input.ownReservationIds.includes(action.reservationId)
      ) {
        return draft("reservation_not_owned");
      }
    }
    if (action.kind === "booking.cancel") {
      // Never let a patient cancel a reservation that is not theirs, even if
      // they produce a valid-looking uuid.
      if (
        !action.reservationId ||
        !input.ownReservationIds.includes(action.reservationId)
      ) {
        return draft("reservation_not_owned");
      }
      // A patient replying "cancel" to a reminder often says nothing else. If
      // the model still reports that it needs to know *which* appointment, then
      // emitting a cancel anyway is a guess — and the cost of guessing is a
      // freed slot the patient still expected to keep.
      if (envelope.needs.includes("reservation_id")) {
        return draft("ambiguous_reservation");
      }
    }
  }

  return { action: "auto_send", reason: "action", actions: envelope.actions };
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { decideAutoReply } from "./decideAutoReply.ts";

const SLOT = "11111111-1111-4111-8111-111111111111";
const RESERVATION = "22222222-2222-4222-8222-222222222222";
const OTHER_RESERVATION = "33333333-3333-4333-8333-333333333333";

function envelope(over: Record<string, unknown> = {}) {
  return {
    language: "ar",
    intent: "other",
    confidence: 0.9,
    handoff: false,
    handoffReason: "",
    reply: "تمام",
    ack: "",
    actions: [],
    offeredSlotIds: [],
    needs: [],
    collected: {},
    ...over,
  };
}

/**
 * A patient moving an appointment reaches the new time through exactly the
 * flow a first booking uses — offer times, read it back, confirm — so the
 * model emits `book_slot` for a move as readily as for a new booking. Run as
 * written, that leaves them holding two appointments and asked for a second
 * deposit on one they have already paid for.
 */
describe("decideAutoReply — moving an appointment is not a second booking", () => {
  const moving = (over: Record<string, unknown> = {}) =>
    decideAutoReply({
      envelope: envelope({
        intent: "booking_reschedule",
        confidence: 0.95,
        actions: [{ kind: "booking.book_slot", slotId: SLOT, patientName: "مهاب" }],
      }),
      injectionFlags: [],
      offeredSlotIds: [SLOT],
      ownReservationIds: [RESERVATION],
      allowBookingWrites: true,
      ...over,
    });

  it("runs it as a reschedule of the appointment they already have", () => {
    const out = moving();
    assert.equal(out.action, "auto_send");
    assert.equal(out.actions.length, 1);
    assert.equal(out.actions[0].kind, "booking.reschedule");
    assert.equal(out.actions[0].reservationId, RESERVATION);
    assert.equal(out.actions[0].slotId, SLOT);
  });

  /** Everything the model collected about the patient survives the rewrite. */
  it("keeps what the model had filled in", () => {
    assert.equal(moving().actions[0].patientName, "مهاب");
  });

  /** Moving the wrong one frees a time the patient still expects to keep. */
  it("refuses to choose when they have more than one appointment", () => {
    const out = moving({ ownReservationIds: [RESERVATION, OTHER_RESERVATION] });
    assert.equal(out.action, "draft");
    assert.equal(out.reason, "ambiguous_reservation");
  });

  /** Nothing to move: this really is their first booking. */
  it("still books normally when they have no appointment yet", () => {
    const out = moving({ ownReservationIds: [] });
    assert.equal(out.action, "auto_send");
    assert.equal(out.actions[0].kind, "booking.book_slot");
  });

  /** They asked for another appointment, not a different one. */
  it("leaves a deliberate second booking alone", () => {
    const out = decideAutoReply({
      envelope: envelope({
        intent: "booking_request",
        confidence: 0.95,
        actions: [{ kind: "booking.book_slot", slotId: SLOT }],
      }),
      injectionFlags: [],
      offeredSlotIds: [SLOT],
      ownReservationIds: [RESERVATION],
      allowBookingWrites: true,
    });
    assert.equal(out.action, "auto_send");
    assert.equal(out.actions[0].kind, "booking.book_slot");
  });

  /** The slot check still comes first — a move is not a way past it. */
  it("refuses a slot it never offered", () => {
    const out = moving({ offeredSlotIds: [] });
    assert.equal(out.action, "draft");
    assert.equal(out.reason, "slot_not_offered");
  });

  /** A rewritten move is still a write, and writes can be switched off. */
  it("obeys the booking-writes switch", () => {
    const out = moving({ allowBookingWrites: false });
    assert.equal(out.action, "draft");
    assert.equal(out.reason, "booking_writes_disabled");
  });
});

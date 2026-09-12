import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { autoReplyEnvelopeSchema } from "./schemas.ts";

const SLOT = "11111111-1111-4111-8111-111111111111";

/**
 * The exact envelope the real model produced when a patient tapped
 * "أكد الحجز" — a correct booking, rejected in full because one unused field
 * came back as "". The patient got silence instead of an appointment.
 */
const REAL_FAILURE = {
  language: "ar",
  intent: "booking_request",
  confidence: 0.95,
  handoff: false,
  handoffReason: "",
  reply: "تمام، جاري تأكيد حجزك مع الدكتور.",
  ack: "",
  actions: [
    {
      kind: "booking.book_slot",
      slotId: SLOT,
      reservationId: "",
      patientName: "علي",
      serviceLabel: "General consultation",
    },
  ],
  offeredSlotIds: [],
  needs: [],
  collected: { service: "General consultation", patientName: "علي", slotId: SLOT },
};

describe("autoReplyEnvelopeSchema — fields the model left blank", () => {
  it("accepts the booking that was being thrown away", () => {
    const parsed = autoReplyEnvelopeSchema.parse(REAL_FAILURE);
    assert.equal(parsed.actions.length, 1);
    assert.equal(parsed.actions[0].slotId, SLOT);
    assert.equal(parsed.actions[0].reservationId, undefined);
    assert.equal(parsed.actions[0].serviceLabel, "General consultation");
  });

  it("treats every blank action field as absent, not invalid", () => {
    const parsed = autoReplyEnvelopeSchema.parse({
      ...REAL_FAILURE,
      actions: [
        {
          kind: "booking.cancel",
          slotId: "",
          reservationId: "",
          patientName: "   ",
          serviceLabel: "",
        },
      ],
    });
    const action = parsed.actions[0];
    assert.equal(action.slotId, undefined);
    assert.equal(action.reservationId, undefined);
    assert.equal(action.patientName, undefined);
    assert.equal(action.serviceLabel, undefined);
  });

  /** A real uuid must still be required where one is given. */
  it("still refuses an identifier that is not a uuid", () => {
    assert.throws(() =>
      autoReplyEnvelopeSchema.parse({
        ...REAL_FAILURE,
        actions: [{ kind: "booking.book_slot", slotId: "the-first-one" }],
      }),
    );
  });

  it("drops junk slot ids instead of failing the whole reply", () => {
    const parsed = autoReplyEnvelopeSchema.parse({
      ...REAL_FAILURE,
      offeredSlotIds: [SLOT, "", "uuid", "not-an-id"],
    });
    assert.deepEqual(parsed.offeredSlotIds, [SLOT]);
  });

  it("drops an unrecognised 'needs' entry instead of failing the reply", () => {
    const parsed = autoReplyEnvelopeSchema.parse({ ...REAL_FAILURE, needs: ["dentist"] });
    assert.deepEqual(parsed.needs, []);
  });

  it("still requires the one field a patient actually reads", () => {
    assert.throws(() => autoReplyEnvelopeSchema.parse({ ...REAL_FAILURE, reply: "" }));
  });
});

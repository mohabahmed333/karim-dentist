import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { runBotActions } from "./processJob.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import type { BotAction } from "./schemas.ts";

const SLOT = "11111111-1111-4111-8111-111111111111";
const RESERVATION = "33333333-3333-4333-8333-333333333333";

/** Records every RPC call; answers each with no error unless told otherwise. */
function fakeDb() {
  const rpcCalls: { fn: string; args: Record<string, unknown> }[] = [];
  return {
    rpcCalls,
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args });
      return { error: null };
    },
  };
}

describe("runBotActions — booking notes", () => {
  /**
   * There is no age or medical-history column on reservations: this is
   * intentionally free text for the dentist to read, appended only when the
   * patient actually gave it.
   */
  it("records age and medical info in the reservation's notes", async () => {
    const db = fakeDb();
    await runBotActions(db as never, "+201000000000", [
      {
        kind: "booking.book_slot",
        slotId: SLOT,
        patientName: "علي",
        serviceLabel: "General consultation",
        age: "34",
        medicalInfo: "بيتناول أدوية ضغط",
      } as BotAction,
    ]);
    assert.equal(db.rpcCalls.length, 1);
    assert.equal(db.rpcCalls[0].fn, "book_open_appointment_slot");
    assert.equal(
      db.rpcCalls[0].args.p_notes,
      "Booked via WhatsApp assistant | Age: 34 | Medical history: بيتناول أدوية ضغط",
    );
  });

  it("adds nothing extra when neither was given", async () => {
    const db = fakeDb();
    await runBotActions(db as never, "+201000000000", [
      { kind: "booking.book_slot", slotId: SLOT } as BotAction,
    ]);
    assert.equal(db.rpcCalls[0].args.p_notes, "Booked via WhatsApp assistant");
  });

  it("appends only the one the patient actually gave", async () => {
    const db = fakeDb();
    await runBotActions(db as never, "+201000000000", [
      { kind: "booking.book_slot", slotId: SLOT, age: "60" } as BotAction,
    ]);
    assert.equal(db.rpcCalls[0].args.p_notes, "Booked via WhatsApp assistant | Age: 60");
  });

  it("never touches notes for a reschedule or a cancel", async () => {
    const db = fakeDb();
    await runBotActions(db as never, "+201000000000", [
      { kind: "booking.reschedule", slotId: SLOT, reservationId: RESERVATION } as BotAction,
    ]);
    assert.equal(db.rpcCalls[0].fn, "reschedule_reservation_to_slot");
    assert.equal("p_notes" in db.rpcCalls[0].args, false);
  });
});

describe("decideJobFinish — recovering from a saturated model chain", () => {
  it("passes sent/drafted/skipped straight through, untouched", async () => {
    // @ts-expect-error -- Node strip-types needs the extension.
    const { decideJobFinish } = await import("./processJob.ts");
    for (const outcome of ["sent", "drafted", "skipped"] as const) {
      assert.deepEqual(decideJobFinish(outcome, 0), { status: outcome });
    }
  });

  /**
   * The actual bug: a job finished as "failed" is invisible to the sweeper
   * forever, so a saturated chain used to leave the patient with permanent
   * silence — no reply, no draft, no retry.
   */
  it("re-queues a failed AI call instead of leaving it terminal", async () => {
    // @ts-expect-error -- Node strip-types needs the extension.
    const { decideJobFinish } = await import("./processJob.ts");
    assert.deepEqual(decideJobFinish("failed", 0), { status: "queued", attempts: 1 });
    assert.deepEqual(decideJobFinish("failed", 1), { status: "queued", attempts: 2 });
  });

  it("gives up only once the shared attempt cap is reached", async () => {
    // @ts-expect-error -- Node strip-types needs the extension.
    const { decideJobFinish } = await import("./processJob.ts");
    // Same cap the sweeper already respects for jobs stuck mid-flight — one
    // number, imported from where it lives, not restated here.
    // @ts-expect-error -- Node strip-types needs the extension.
    const { MAX_LLM_ATTEMPTS } = await import("./store.ts");
    assert.deepEqual(decideJobFinish("failed", MAX_LLM_ATTEMPTS - 1), {
      status: "failed",
      attempts: MAX_LLM_ATTEMPTS,
    });
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "./testing/fakeDb.ts";
import {
  parseStatus,
  reservationCancelAdapter,
  reservationCreateAdapter,
  reservationRescheduleAdapter,
  reservationSetStatusAdapter,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./reservationAdapters.ts";

const FUTURE = new Date(Date.now() + 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

const openSlot = { id: "slot-1", starts_at: FUTURE, status: "open" };
const reservation = {
  id: "res-1",
  starts_at: FUTURE,
  status: "pending",
  phone: "+201001234567",
  deleted_at: null,
};

const ctx = (db: unknown) => ({ db, actorId: "admin-1" });
const act = (kind: string, payload: Record<string, unknown>) => ({
  id: "a1",
  kind,
  label: kind,
  dependsOn: [],
  payload,
});

describe("reservation.create", () => {
  it("previews the slot transition and warns on a taken slot", async () => {
    const db = createFakeDb({
      tables: { appointment_slots: [{ ...openSlot, status: "booked" }] },
    });
    const out = await reservationCreateAdapter.preview(
      act("reservation.create", { slotId: "slot-1", patient_name: "Ali", phone: "+20100" }),
      ctx(db),
    );
    assert.equal(out.before.status, "booked");
    assert.equal(out.after.status, "booked");
    assert.ok(out.warnings?.some((w: string) => /not open/i.test(w)));
  });

  it("warns on a slot in the past", async () => {
    const db = createFakeDb({
      tables: { appointment_slots: [{ ...openSlot, starts_at: PAST }] },
    });
    const out = await reservationCreateAdapter.preview(
      act("reservation.create", { slotId: "slot-1", patient_name: "Ali", phone: "+20100" }),
      ctx(db),
    );
    assert.ok(out.warnings?.some((w: string) => /past/i.test(w)));
  });

  it("books through the atomic RPC", async () => {
    const db = createFakeDb({
      tables: { appointment_slots: [openSlot] },
      rpc: { book_open_appointment_slot: { data: "res-9", error: null } },
    });
    const out = await reservationCreateAdapter.execute(
      act("reservation.create", {
        slotId: "slot-1",
        patient_name: "Ali",
        phone: "+201001234567",
      }),
      ctx(db),
    );
    assert.equal(out.ok, true);
    const [call] = db.rpcCalls();
    assert.equal(call.fn, "book_open_appointment_slot");
    assert.equal(call.args.p_slot_id, "slot-1");
    assert.equal(call.args.p_service_label, "General consultation");
  });

  it("surfaces the RPC message rather than a generic failure", async () => {
    const db = createFakeDb({
      tables: { appointment_slots: [openSlot] },
      rpc: {
        book_open_appointment_slot: {
          data: null,
          error: { message: "Slot is no longer available" },
        },
      },
    });
    await assert.rejects(
      () =>
        reservationCreateAdapter.execute(
          act("reservation.create", { slotId: "slot-1", patient_name: "A", phone: "1" }),
          ctx(db),
        ),
      /no longer available/,
    );
  });
});

describe("reservation.reschedule", () => {
  it("previews the move from old time to new", async () => {
    const later = new Date(Date.now() + 172_800_000).toISOString();
    const db = createFakeDb({
      tables: {
        reservations: [reservation],
        appointment_slots: [{ id: "slot-2", starts_at: later, status: "open" }],
      },
    });
    const out = await reservationRescheduleAdapter.preview(
      act("reservation.reschedule", { reservationId: "res-1", slotId: "slot-2" }),
      ctx(db),
    );
    assert.equal(out.before.starts_at, FUTURE);
    assert.equal(out.after.starts_at, later);
    assert.deepEqual(out.warnings, []);
  });

  it("moves through the atomic RPC, forwarding the phone guard", async () => {
    const db = createFakeDb({
      tables: { reservations: [reservation], appointment_slots: [openSlot] },
    });
    await reservationRescheduleAdapter.execute(
      act("reservation.reschedule", {
        reservationId: "res-1",
        slotId: "slot-1",
        phone: "+201001234567",
      }),
      ctx(db),
    );
    const [call] = db.rpcCalls();
    assert.equal(call.fn, "reschedule_reservation_to_slot");
    assert.equal(call.args.p_reservation_id, "res-1");
    assert.equal(call.args.p_phone, "+201001234567");
  });

  it("passes a null phone for admin callers rather than an empty string", async () => {
    const db = createFakeDb({
      tables: { reservations: [reservation], appointment_slots: [openSlot] },
    });
    await reservationRescheduleAdapter.execute(
      act("reservation.reschedule", { reservationId: "res-1", slotId: "slot-1" }),
      ctx(db),
    );
    assert.equal(db.rpcCalls()[0].args.p_phone, null);
  });
});

describe("reservation.cancel", () => {
  it("cancels through the RPC so the slot is released", async () => {
    const db = createFakeDb({ tables: { reservations: [reservation] } });
    const out = await reservationCancelAdapter.execute(
      act("reservation.cancel", { reservationId: "res-1" }),
      ctx(db),
    );
    assert.equal(out.ok, true);
    assert.equal(db.rpcCalls()[0].fn, "cancel_reservation_and_release_slot");
  });

  it("warns when already cancelled instead of failing the preview", async () => {
    const db = createFakeDb({
      tables: { reservations: [{ ...reservation, status: "cancelled" }] },
    });
    const out = await reservationCancelAdapter.preview(
      act("reservation.cancel", { reservationId: "res-1" }),
      ctx(db),
    );
    assert.deepEqual(out.warnings, ["Already cancelled"]);
  });

  it("rejects an unknown reservation", async () => {
    const db = createFakeDb({ tables: { reservations: [] } });
    await assert.rejects(
      () =>
        reservationCancelAdapter.preview(
          act("reservation.cancel", { reservationId: "nope" }),
          ctx(db),
        ),
      /not found/i,
    );
  });
});

describe("reservation.set_status", () => {
  it("updates the status column", async () => {
    const db = createFakeDb({ tables: { reservations: [reservation] } });
    const out = await reservationSetStatusAdapter.execute(
      act("reservation.set_status", { reservationId: "res-1", status: "confirmed" }),
      ctx(db),
    );
    assert.equal(out.ok, true);
    const [update] = db.updatesTo("reservations");
    assert.equal(update.values.status, "confirmed");
    assert.equal(update.filters.id, "res-1");
  });

  it("normalises spacing and case in the status", () => {
    assert.equal(parseStatus("No Show"), "no_show");
    assert.equal(parseStatus("  CONFIRMED "), "confirmed");
    assert.equal(parseStatus("no-show"), "no_show");
  });

  /**
   * Cancelling must also free the appointment slot, which only
   * reservation.cancel does. Allowing it here would silently leave the slot
   * booked and unbookable.
   */
  it("refuses to cancel, pointing at reservation.cancel", () => {
    assert.throws(() => parseStatus("cancelled"), /reservation\.cancel/);
    assert.throws(() => parseStatus("canceled"), /reservation\.cancel/);
  });

  it("rejects an unknown status", () => {
    assert.throws(() => parseStatus("vanished"), /Unknown reservation status/);
  });
});

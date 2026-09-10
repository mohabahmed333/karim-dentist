import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { followupBookAdapter } from "./navFollowupAdapters.ts";

type RpcCall = { fn: string; args: Record<string, unknown> };

/**
 * Fake Supabase client covering only what this adapter touches:
 * `.rpc()`, and the `.from().select().eq().maybeSingle()` / `.update().eq()`
 * chains.
 */
function fakeDb(opts: {
  rpcResult?: { data: unknown; error: unknown };
  reservationRow?: Record<string, unknown> | null;
}) {
  const rpcCalls: RpcCall[] = [];
  const updates: { table: string; values: Record<string, unknown> }[] = [];
  return {
    rpcCalls,
    updates,
    async rpc(fn: string, args: Record<string, unknown>) {
      rpcCalls.push({ fn, args });
      return opts.rpcResult ?? { data: "res-1", error: null };
    },
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: opts.reservationRow ?? null, error: null };
                },
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          updates.push({ table, values });
          return { async eq() { return { data: null, error: null }; } };
        },
      };
    },
  };
}

const action = {
  id: "f1",
  kind: "followup.book" as const,
  label: "Book follow-up",
  dependsOn: [],
  payload: {
    slotId: "00000000-0000-0000-0000-000000000001",
    patient_name: "Ali",
    phone: "+201001234567",
    service_label: "Follow-up",
  },
};

describe("followupBookAdapter.execute", () => {
  it("books through the atomic RPC rather than insert-then-update", async () => {
    const db = fakeDb({ reservationRow: { id: "res-1", patient_name: "Ali" } });
    const out = await followupBookAdapter.execute(action, {
      db,
      actorId: "admin-1",
    });
    assert.equal(out.ok, true);
    assert.equal(db.rpcCalls.length, 1);
    assert.equal(db.rpcCalls[0].fn, "book_open_appointment_slot");
    assert.equal(db.rpcCalls[0].args.p_slot_id, action.payload.slotId);
    assert.equal(db.rpcCalls[0].args.p_patient_name, "Ali");
  });

  /**
   * The regression. Previously the slot UPDATE was guarded by
   * `.eq("status","open")`, and a zero-row update is not a Supabase error —
   * so losing the race returned ok:true "Follow-up booked" while leaving an
   * orphan reservation and an unbooked slot. The RPC now raises instead.
   */
  it("propagates a lost race instead of reporting success", async () => {
    const db = fakeDb({
      rpcResult: { data: null, error: { message: "Slot is no longer available" } },
    });
    await assert.rejects(
      () => followupBookAdapter.execute(action, { db, actorId: "admin-1" }),
      /no longer available/,
    );
    assert.equal(db.updates.length, 0, "must not touch treatments on failure");
  });

  it("fails loudly when the RPC returns no reservation id", async () => {
    const db = fakeDb({ rpcResult: { data: null, error: null } });
    await assert.rejects(
      () => followupBookAdapter.execute(action, { db, actorId: "admin-1" }),
      /did not return a reservation/,
    );
  });

  it("links a treatment to the new reservation when one is given", async () => {
    const db = fakeDb({ reservationRow: { id: "res-1" } });
    await followupBookAdapter.execute(
      { ...action, payload: { ...action.payload, treatmentId: "t-9" } },
      { db, actorId: "admin-1" },
    );
    assert.equal(db.updates.length, 1);
    assert.equal(db.updates[0].table, "patient_treatments");
    assert.equal(db.updates[0].values.status, "scheduled");
    assert.equal(db.updates[0].values.reservation_id, "res-1");
  });
});

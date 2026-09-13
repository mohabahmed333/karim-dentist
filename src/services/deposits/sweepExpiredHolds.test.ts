import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { sweepExpiredHolds } from "./sweepExpiredHolds.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const NOW = new Date("2026-09-13T12:00:00Z");
const SETTINGS = { id: "d1", enabled: true, amount_egp: 200 };

const request = (over: Record<string, unknown> = {}) => ({
  id: "req-1",
  reservation_id: "res-1",
  conversation_id: "conv-1",
  phone: "01005559999",
  amount_egp: 200,
  status: "awaiting_receipt",
  expires_at: "2026-09-13T11:30:00Z",
  created_at: "2026-09-13T11:00:00Z",
  ...over,
});

const db = (rows: Record<string, unknown>[], rpc?: Record<string, unknown>) =>
  createFakeDb({
    tables: { deposit_settings: [SETTINGS], deposit_requests: rows },
    rpc: (rpc ?? { expire_deposit_hold: { data: true, error: null } }) as never,
  });

describe("sweepExpiredHolds", () => {
  it("releases a hold whose time is up", async () => {
    const fake = db([request()]);
    const out = await sweepExpiredHolds(fake as never, NOW);
    assert.deepEqual(out, { expired: 1, notified: 0 });
    const calls = fake.rpcCalls().filter((c) => c.fn === "expire_deposit_hold");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].args.p_deposit_request_id, "req-1");
  });

  it("leaves a hold that has not expired yet", async () => {
    const fake = db([request({ expires_at: "2026-09-13T12:30:00Z" })]);
    const out = await sweepExpiredHolds(fake as never, NOW);
    assert.deepEqual(out, { expired: 0, notified: 0 });
    assert.equal(fake.rpcCalls().length, 0);
  });

  it("never touches a deposit a person is reviewing, however old", async () => {
    // The clock stops in in_review on purpose: our own failure to read a
    // receipt must not cost the patient their appointment.
    const fake = db([request({ status: "in_review", expires_at: "2026-09-01T00:00:00Z" })]);
    const out = await sweepExpiredHolds(fake as never, NOW);
    assert.equal(out.expired, 0);
    assert.equal(fake.rpcCalls().length, 0);
  });

  it("ignores holds already settled", async () => {
    const fake = db([
      request({ id: "a", status: "paid" }),
      request({ id: "b", status: "expired" }),
      request({ id: "c", status: "rejected" }),
      request({ id: "d", status: "cancelled" }),
    ]);
    assert.equal((await sweepExpiredHolds(fake as never, NOW)).expired, 0);
  });

  it("does nothing when deposits were never configured", async () => {
    const fake = createFakeDb({
      tables: { deposit_settings: [], deposit_requests: [request()] },
    });
    const out = await sweepExpiredHolds(fake as never, NOW);
    assert.deepEqual(out, { expired: 0, notified: 0 });
  });

  it("stops at the batch size, so a cold start cannot run away", async () => {
    const rows = Array.from({ length: 25 }, (_, i) => request({ id: `req-${i}` }));
    const fake = db(rows);
    const out = await sweepExpiredHolds(fake as never, NOW);
    assert.equal(out.expired, 10);
  });

  it("tells the patient, after the slot is already free", async () => {
    const fake = db([request()]);
    const sent: { conversationId: string; text: string }[] = [];
    const out = await sweepExpiredHolds(fake as never, NOW, {
      notify: async (input) => {
        // The release must already have happened by the time we speak.
        assert.equal(fake.rpcCalls().filter((c) => c.fn === "expire_deposit_hold").length, 1);
        sent.push(input);
      },
      language: () => "en",
    });
    assert.deepEqual(out, { expired: 1, notified: 1 });
    assert.equal(sent[0].conversationId, "conv-1");
    assert.match(sent[0].text, /released/);
  });

  it("counts the release even when the message fails to send", async () => {
    const fake = db([request()]);
    const out = await sweepExpiredHolds(fake as never, NOW, {
      notify: async () => {
        throw new Error("session closed");
      },
    });
    assert.deepEqual(out, { expired: 1, notified: 0 });
  });

  it("stays quiet about a hold with no conversation to write to", async () => {
    const fake = db([request({ conversation_id: null })]);
    let called = false;
    const out = await sweepExpiredHolds(fake as never, NOW, {
      notify: async () => {
        called = true;
      },
    });
    assert.equal(out.expired, 1);
    assert.equal(called, false);
  });

  it("does not report a release the database refused", async () => {
    // A receipt that landed a moment ago makes the RPC a no-op; the patient
    // must not then be told their hold lapsed.
    const fake = db([request()], { expire_deposit_hold: { data: false, error: null } });
    let called = false;
    const out = await sweepExpiredHolds(fake as never, NOW, {
      notify: async () => {
        called = true;
      },
    });
    assert.deepEqual(out, { expired: 0, notified: 0 });
    assert.equal(called, false);
  });
});

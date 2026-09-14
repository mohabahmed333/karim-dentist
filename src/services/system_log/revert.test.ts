import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { revertSystemAction } from "./revert.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../admin_ai/testing/fakeDb.ts";

describe("revertSystemAction", () => {
  it("calls the RPC with the log id", async () => {
    const db = createFakeDb();
    await revertSystemAction(db, "log-1");
    const calls = db.rpcCalls();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].fn, "revert_system_action");
    assert.deepEqual(calls[0].args, { p_log_id: "log-1" });
  });

  it("throws the RPC's error message on failure", async () => {
    const db = createFakeDb({
      rpc: { revert_system_action: { data: null, error: { message: "Already reverted" } } },
    });
    await assert.rejects(() => revertSystemAction(db, "log-1"), /Already reverted/);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { searchKnowledgeTool, searchKnowledgeArgs } from "./searchKnowledgeTool.ts";

function dbWithRpc(rows: unknown[]) {
  return {
    rpc: async () => ({ data: rows, error: null }),
  };
}

describe("searchKnowledgeTool", () => {
  it("keeps only entries close to the best match", async () => {
    const db = dbWithRpc([
      { title: "Cancellation policy", title_ar: "", body: "24h notice", body_ar: "", rank: 0.9 },
      { title: "Parking", title_ar: "", body: "Free parking", body_ar: "", rank: 0.05 },
    ]);
    const out = await searchKnowledgeTool(db as never, searchKnowledgeArgs.parse({ query: "cancel" }));
    assert.equal(out.length, 1);
    assert.equal(out[0]?.title, "Cancellation policy");
  });

  it("falls back to the Arabic column when English is empty", async () => {
    const db = dbWithRpc([{ title: "", title_ar: "سياسة الإلغاء", body: "", body_ar: "قبل ٢٤ ساعة", rank: 0.9 }]);
    const out = await searchKnowledgeTool(db as never, searchKnowledgeArgs.parse({ query: "الغاء" }));
    assert.equal(out[0]?.title, "سياسة الإلغاء");
  });

  it("returns an empty list rather than throwing when the RPC errors", async () => {
    const db = { rpc: async () => ({ data: null, error: { message: "boom" } }) };
    const out = await searchKnowledgeTool(db as never, searchKnowledgeArgs.parse({ query: "x" }));
    assert.deepEqual(out, []);
  });

  it("returns nothing when no row is even a weak match", async () => {
    const db = dbWithRpc([{ title: "Unrelated", title_ar: "", body: "x", body_ar: "", rank: 0.001 }]);
    const out = await searchKnowledgeTool(db as never, searchKnowledgeArgs.parse({ query: "x" }));
    assert.deepEqual(out, []);
  });
});

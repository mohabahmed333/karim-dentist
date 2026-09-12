import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { mergeMeta } from "./mergeMeta.ts";

describe("mergeMeta", () => {
  it("keeps existing fields the patch doesn't mention", () => {
    const out = mergeMeta({ actions: [{ id: "a", label: "A" }] }, { feedback: "up" });
    assert.deepEqual(out.actions, [{ id: "a", label: "A" }]);
    assert.equal(out.feedback, "up");
  });

  it("overwrites a field the patch does mention", () => {
    const out = mergeMeta({ feedback: "up" }, { feedback: "down" });
    assert.equal(out.feedback, "down");
  });

  it("clearing a field with undefined drops it from the merged object", () => {
    const out = mergeMeta({ feedback: "up" }, { feedback: undefined });
    assert.equal("feedback" in out, false);
  });

  it("starts from an empty object when there is no existing meta", () => {
    assert.deepEqual(mergeMeta(null, { feedback: "up" }), { feedback: "up" });
  });
});

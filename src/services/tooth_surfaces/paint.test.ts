import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { applyPaint, emptySurfaces } from "./paint.ts";

describe("surface paint", () => {
  it("paints one surface for decay and the whole tooth for missing", () => {
    const decayed = applyPaint(emptySurfaces(), "decay", "mesial");
    assert.equal(decayed.mesial, "decay");
    assert.equal(decayed.distal, "unmarked");
    const missing = applyPaint(decayed, "missing", "occlusal");
    assert.equal(missing.whole, "missing");
    const cleared = applyPaint(missing, "clear", "occlusal");
    assert.equal(cleared.whole, "none");
    assert.equal(cleared.mesial, "unmarked");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { scrollDeltaForDragEdge } from "./dashboardDragScroll.ts";

describe("dashboardDragScroll", () => {
  it("scrolls up near the top edge", () => {
    assert.ok(scrollDeltaForDragEdge(10, 0, 400) < 0);
    assert.equal(scrollDeltaForDragEdge(200, 0, 400), 0);
  });

  it("scrolls down near the bottom edge", () => {
    assert.ok(scrollDeltaForDragEdge(390, 0, 400) > 0);
  });

  it("speeds up closer to the edge", () => {
    const slow = Math.abs(scrollDeltaForDragEdge(60, 0, 400));
    const fast = Math.abs(scrollDeltaForDragEdge(5, 0, 400));
    assert.ok(fast >= slow);
  });

  it("returns 0 for invalid geometry", () => {
    assert.equal(scrollDeltaForDragEdge(10, 100, 100), 0);
  });
});

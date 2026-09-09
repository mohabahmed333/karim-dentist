import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampGhostSize,
  documentOrderFlipped,
  ratioPointInRect,
  showreelDragSupported,
} from "./showreelDragCarry.ts";

describe("showreel drag carry", () => {
  it("aims at the fraction of the box that decides the drop edge", () => {
    const rect = { left: 100, top: 200, width: 400, height: 120 };
    // The app resolves left/right from the pointer's x ratio, so these two
    // are the difference between "drops before" and "drops after".
    assert.deepEqual(ratioPointInRect(rect, { x: 0.22, y: 0.5 }), {
      x: 188,
      y: 260,
    });
    assert.deepEqual(ratioPointInRect(rect, { x: 0.78, y: 0.5 }), {
      x: 412,
      y: 260,
    });
  });

  it("centres on 0.5/0.5", () => {
    assert.deepEqual(
      ratioPointInRect({ left: 0, top: 0, width: 200, height: 80 }, {
        x: 0.5,
        y: 0.5,
      }),
      { x: 100, y: 40 },
    );
  });

  it("keeps the carried card readable but never scene-sized", () => {
    assert.deepEqual(clampGhostSize(330, 118), { width: 330, height: 118 });
    assert.deepEqual(clampGhostSize(1200, 900), { width: 340, height: 200 });
    assert.deepEqual(clampGhostSize(40, 10), { width: 160, height: 72 });
  });

  it("rounds fractional rects and survives a rect that never measured", () => {
    assert.deepEqual(clampGhostSize(330.4, 117.6), {
      width: 330,
      height: 118,
    });
    assert.deepEqual(clampGhostSize(NaN, NaN), { width: 160, height: 72 });
  });

  it("detects a drop that reordered the layout", () => {
    const PRECEDING = 2;
    const FOLLOWING = 4;
    // Source was before the target, now after it: the move landed.
    assert.equal(documentOrderFlipped(FOLLOWING, PRECEDING), true);
    assert.equal(documentOrderFlipped(PRECEDING, FOLLOWING), true);
  });

  it("treats an unchanged or unreadable order as a drop that did nothing", () => {
    const FOLLOWING = 4;
    const CONTAINED = 16;
    assert.equal(documentOrderFlipped(FOLLOWING, FOLLOWING), false);
    // Disconnected/contained-only masks carry no order to compare.
    assert.equal(documentOrderFlipped(0, FOLLOWING), false);
    assert.equal(documentOrderFlipped(FOLLOWING, CONTAINED), false);
  });

  it("ignores the containment bits when comparing order", () => {
    const PRECEDING = 2;
    const FOLLOWING = 4;
    const CONTAINS = 8;
    assert.equal(
      documentOrderFlipped(FOLLOWING | CONTAINS, PRECEDING | CONTAINS),
      true,
    );
  });

  it("reports no drag support without a constructable DataTransfer", () => {
    // Node has neither global; the scripted steps fall back to a dispatch.
    assert.equal(showreelDragSupported(), false);
  });
});

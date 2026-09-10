import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampComparePosition } from "./clampComparePosition";

describe("clampComparePosition", () => {
  it("keeps values inside 0–100", () => {
    assert.equal(clampComparePosition(50), 50);
    assert.equal(clampComparePosition(-10), 0);
    assert.equal(clampComparePosition(140), 100);
  });

  it("rounds to one decimal for smooth dragging", () => {
    assert.equal(clampComparePosition(33.333), 33.3);
  });
});

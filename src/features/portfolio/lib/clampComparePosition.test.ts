import { describe, expect, it } from "vitest";
import { clampComparePosition } from "./clampComparePosition";

describe("clampComparePosition", () => {
  it("keeps values inside 0–100", () => {
    expect(clampComparePosition(50)).toBe(50);
    expect(clampComparePosition(-10)).toBe(0);
    expect(clampComparePosition(140)).toBe(100);
  });

  it("rounds to one decimal for smooth dragging", () => {
    expect(clampComparePosition(33.333)).toBe(33.3);
  });
});

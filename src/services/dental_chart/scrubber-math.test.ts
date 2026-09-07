import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { pixelToYear, rangeFromPixels, yearToPct, zoomScaleAt } from "./scrubber-math.ts";

describe("scrubber math", () => {
  it("maps track pixels to years with 2022 on the left", () => {
    assert.equal(Math.round(pixelToYear(0, 800)), 2022);
    assert.equal(Math.round(pixelToYear(800, 800)), 2014);
  });

  it("builds a timeline range from drag pixels", () => {
    const range = rangeFromPixels(500, 650, 800, [
      { key: "a", pct: yearToPct(2015), size: 8, label: "07.10", count: 1 },
    ]);
    assert.ok(range.startYear <= range.endYear);
    assert.ok(range.startYear >= 2014 && range.endYear <= 2022);
  });

  it("steps zoom scale through 1x → 4x", () => {
    assert.equal(zoomScaleAt(0), 1);
    assert.equal(zoomScaleAt(1), 2);
    assert.equal(zoomScaleAt(2), 4);
  });
});

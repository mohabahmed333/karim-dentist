import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { CHARTING_TOUR_STEPS, shouldOpenChartingTour } from "./chartingTour.ts";

describe("charting tutorial", () => {
  it("opens until dismissed and has three chairside steps", () => {
    assert.equal(shouldOpenChartingTour(null), true);
    assert.equal(shouldOpenChartingTour("1"), false);
    assert.equal(CHARTING_TOUR_STEPS.length, 3);
    assert.match(CHARTING_TOUR_STEPS[2].body, /note/i);
  });
});

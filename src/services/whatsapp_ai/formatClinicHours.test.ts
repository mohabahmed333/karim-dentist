import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { collapseWeekdays, formatClinicHours } from "./formatClinicHours.ts";

describe("formatClinicHours", () => {
  it("collapses consecutive days into a range, as a person would say it", () => {
    const out = formatClinicHours({
      open_weekdays: [0, 1, 2, 3, 4],
      time_windows: ["10:00-13:00", "14:00-18:00"],
      timezone: "Africa/Cairo",
    });
    assert.match(out, /Sunday to Thursday/);
    assert.match(out, /10:00 to 13:00 and 14:00 to 18:00/);
    assert.match(out, /Africa\/Cairo/);
  });

  it("lists non-consecutive days separately", () => {
    const out = formatClinicHours({
      open_weekdays: [0, 2, 4],
      time_windows: ["10:00-18:00"],
      timezone: null,
    });
    assert.match(out, /Sunday, Tuesday, Thursday/);
  });

  it("handles a mix of runs and single days", () => {
    const out = formatClinicHours({
      open_weekdays: [0, 1, 2, 6],
      time_windows: ["09:00-17:00"],
      timezone: null,
    });
    assert.match(out, /Sunday to Tuesday, Saturday/);
  });

  it("says the clinic is closed on unlisted days", () => {
    const out = formatClinicHours({
      open_weekdays: [1],
      time_windows: ["10:00-18:00"],
      timezone: null,
    });
    assert.match(out, /closed on any day not listed/i);
  });

  /** Better to hand off than to state hours that do not exist. */
  it("tells the model not to state hours when none are configured", () => {
    for (const input of [
      null,
      { open_weekdays: [], time_windows: ["10:00-18:00"] },
      { open_weekdays: [0], time_windows: [] },
      { open_weekdays: [99], time_windows: ["10:00-18:00"] },
    ]) {
      assert.match(formatClinicHours(input), /do not state opening hours/i);
    }
  });
});

describe("collapseWeekdays", () => {
  it("groups consecutive days, dropping duplicates and invalid days", () => {
    assert.deepEqual(collapseWeekdays([4, 0, 1, 1, 2, 6, 9, -1]), [[0, 1, 2], [4], [6]]);
  });

  it("returns no groups for no valid days", () => {
    assert.deepEqual(collapseWeekdays([7, 1.5]), []);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { mergeClinicHours } from "./scheduleAdapters.ts";

const current = {
  id: "hours-1",
  open_weekdays: [0, 1, 2, 3, 4],
  time_windows: ["10:00-13:00", "14:00-18:00"],
  slot_minutes: 60,
  horizon_days: 21,
  timezone: "Africa/Cairo",
};

describe("mergeClinicHours", () => {
  it("keeps fields the payload omits", () => {
    const out = mergeClinicHours(current, { slot_minutes: 30 });
    assert.equal(out.slot_minutes, 30);
    assert.deepEqual(out.time_windows, current.time_windows);
    assert.deepEqual(out.open_weekdays, current.open_weekdays);
  });

  /**
   * Overlapping windows are not caught by any DB constraint — they silently
   * collapse into duplicate slot start times, which the unique index then
   * dedupes. The result is a quietly wrong schedule, so this must fail loudly.
   */
  it("rejects overlapping time windows", () => {
    assert.throws(
      () => mergeClinicHours(current, { time_windows: ["10:00-13:00", "12:00-15:00"] }),
      /overlap/i,
    );
  });

  it("rejects a malformed window", () => {
    assert.throws(
      () => mergeClinicHours(current, { time_windows: ["10am-1pm"] }),
      /10:00-13:00/,
    );
  });

  it("rejects a window that ends before it starts", () => {
    assert.throws(
      () => mergeClinicHours(current, { time_windows: ["18:00-10:00"] }),
      /must be after/i,
    );
  });

  it("rejects a slot length the schedule cannot use", () => {
    assert.throws(() => mergeClinicHours(current, { slot_minutes: 37 }), /slot_minutes/);
  });

  it("holds the horizon inside the DB CHECK range", () => {
    assert.throws(() => mergeClinicHours(current, { horizon_days: 3 }), /between 7 and 60/);
    assert.throws(() => mergeClinicHours(current, { horizon_days: 90 }), /between 7 and 60/);
    assert.equal(mergeClinicHours(current, { horizon_days: 30 }).horizon_days, 30);
  });

  it("requires at least one open day, and validates weekday numbers", () => {
    assert.throws(() => mergeClinicHours(current, { open_weekdays: [] }), /at least one/i);
    assert.throws(() => mergeClinicHours(current, { open_weekdays: [7] }), /Invalid weekday/);
    assert.throws(() => mergeClinicHours(current, { open_weekdays: [-1] }), /Invalid weekday/);
  });

  it("accepts a full valid replacement", () => {
    const out = mergeClinicHours(current, {
      open_weekdays: [1, 2, 3],
      time_windows: ["09:00-12:00"],
      slot_minutes: 45,
      horizon_days: 14,
    });
    assert.deepEqual(out.open_weekdays, [1, 2, 3]);
    assert.equal(out.slot_minutes, 45);
  });
});

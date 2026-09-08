import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  calendarMonthMotionKey,
  calendarMonthSlideDir,
} from "./calendarMonthMotion.ts";

test("calendarMonthMotionKey is year-month", () => {
  assert.equal(calendarMonthMotionKey(new Date(2026, 8, 15)), "2026-09");
});

test("calendarMonthSlideDir detects next and previous", () => {
  assert.equal(
    calendarMonthSlideDir(new Date(2026, 8, 1), new Date(2026, 9, 1)),
    1,
  );
  assert.equal(
    calendarMonthSlideDir(new Date(2026, 8, 1), new Date(2026, 7, 1)),
    -1,
  );
  assert.equal(
    calendarMonthSlideDir(new Date(2026, 8, 1), new Date(2026, 8, 20)),
    0,
  );
});

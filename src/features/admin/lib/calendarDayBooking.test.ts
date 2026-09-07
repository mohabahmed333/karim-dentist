import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarDayBookingBlockReason } from "./calendarDayBooking.ts";

test("blocks days before today", () => {
  assert.equal(
    calendarDayBookingBlockReason("2026-09-07", "2026-09-08", new Set(["2026-09-07"])),
    "past",
  );
});

test("blocks today-or-future days with no open slots", () => {
  assert.equal(
    calendarDayBookingBlockReason("2026-09-11", "2026-09-08", new Set()),
    "no_slots",
  );
});

test("allows today when open slots exist", () => {
  assert.equal(
    calendarDayBookingBlockReason(
      "2026-09-08",
      "2026-09-08",
      new Set(["2026-09-08"]),
    ),
    null,
  );
});

test("allows future day with open slots", () => {
  assert.equal(
    calendarDayBookingBlockReason(
      "2026-09-11",
      "2026-09-08",
      new Set(["2026-09-11", "2026-09-12"]),
    ),
    null,
  );
});

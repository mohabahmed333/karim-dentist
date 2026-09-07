import assert from "node:assert/strict";
import { test } from "node:test";
import { expandDateRangeToInclude } from "./reservationDateRange.ts";

test("expands from when day is earlier", () => {
  assert.deepEqual(
    expandDateRangeToInclude("2026-09-08", "2026-09-08", "2026-09-01"),
    { from: "2026-09-01", to: "2026-09-08" },
  );
});

test("expands to when day is later", () => {
  assert.deepEqual(
    expandDateRangeToInclude("2026-09-08", "2026-09-08", "2026-09-11"),
    { from: "2026-09-08", to: "2026-09-11" },
  );
});

test("keeps range when day is inside", () => {
  assert.deepEqual(
    expandDateRangeToInclude("2026-09-01", "2026-09-30", "2026-09-11"),
    { from: "2026-09-01", to: "2026-09-30" },
  );
});

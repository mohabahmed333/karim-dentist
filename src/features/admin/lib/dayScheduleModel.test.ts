import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCalendarDays,
  dayScheduleDayIso,
  daySchedulePrefetchDays,
  dayScheduleQueryBounds,
  dayScheduleTitle,
  dayWithinCoverage,
  expandCoverageThroughAfterTomorrow,
  reservationsForDay,
} from "./dayScheduleModel.ts";
import type { Reservation } from "@/services/reservations/types.ts";

const base: Omit<Reservation, "id" | "starts_at" | "status"> = {
  patient_name: "Test",
  phone: "+20",
  email: null,
  service_id: null,
  service_label: "Consult",
  notes: "",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

describe("dayScheduleModel", () => {
  it("filters reservations to the selected local day", () => {
    const day = new Date(2026, 8, 8, 0, 0, 0);
    const rows = reservationsForDay(
      [
        {
          ...base,
          id: "1",
          status: "confirmed",
          starts_at: new Date(2026, 8, 8, 10, 0, 0).toISOString(),
        },
        {
          ...base,
          id: "2",
          status: "confirmed",
          starts_at: new Date(2026, 8, 9, 10, 0, 0).toISOString(),
        },
        {
          ...base,
          id: "3",
          status: "cancelled",
          starts_at: new Date(2026, 8, 8, 11, 0, 0).toISOString(),
        },
      ],
      day,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, "1");
  });

  it("builds query bounds for the local calendar day", () => {
    const day = new Date(2026, 8, 8, 0, 0, 0);
    const next = addCalendarDays(day, 1);
    const bounds = dayScheduleQueryBounds(day);
    const nextBounds = dayScheduleQueryBounds(next);
    assert.ok(bounds.startIso < bounds.endIso);
    assert.ok(bounds.endIso < nextBounds.startIso);
  });

  it("detects whether a day is inside the loaded coverage window", () => {
    const day = new Date(2026, 8, 8, 0, 0, 0);
    assert.equal(dayWithinCoverage(day, "2026-09-01", "2026-09-30"), true);
    assert.equal(dayWithinCoverage(day, "2026-09-09", "2026-09-30"), false);
  });

  it("prefetch days are tomorrow and the day after", () => {
    const today = new Date(2026, 8, 8, 12, 0, 0);
    const days = daySchedulePrefetchDays(today);
    assert.equal(days.length, 2);
    assert.equal(dayScheduleDayIso(days[0]!), "2026-09-09");
    assert.equal(dayScheduleDayIso(days[1]!), "2026-09-10");
  });

  it("labels tomorrow and day after tomorrow", () => {
    const today = new Date(2026, 8, 8, 0, 0, 0);
    assert.equal(dayScheduleTitle(today, today), "Today");
    assert.equal(
      dayScheduleTitle(addCalendarDays(today, 1), today),
      "Tomorrow",
    );
    assert.equal(
      dayScheduleTitle(addCalendarDays(today, 2), today),
      "Day after tomorrow",
    );
  });

  it("expands coverage to at least day after tomorrow", () => {
    const now = new Date(2026, 8, 8, 12, 0, 0);
    assert.deepEqual(
      expandCoverageThroughAfterTomorrow("2026-09-08", "2026-09-08", now),
      { from: "2026-09-08", to: "2026-09-10" },
    );
    assert.deepEqual(
      expandCoverageThroughAfterTomorrow("2026-09-01", "2026-09-30", now),
      { from: "2026-09-01", to: "2026-09-30" },
    );
  });
});

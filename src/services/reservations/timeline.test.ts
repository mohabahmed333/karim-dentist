import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  barGridColumn,
  buildCalendarGrid,
  buildMonthDays,
  buildTimelineRows,
  dayIndexForDays,
  filterReservationsForTimeline,
  getMonthRange,
  groupReservationsByDay,
  reservationDayIso,
  shiftStartsAtToDate,
  timelineEventTitle,
} from "./timeline.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import type { Reservation } from "./types.ts";

const base: Omit<Reservation, "id" | "starts_at" | "status" | "service_label"> = {
  patient_name: "Test",
  phone: "+20 100 000 0000",
  email: null,
  service_id: null,
  notes: "",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

function row(
  id: string,
  startsAt: string,
  status: Reservation["status"] = "pending",
): Reservation {
  return {
    ...base,
    id,
    starts_at: startsAt,
    status,
    service_label: "General consultation",
  };
}

describe("reservation timeline", () => {
  const anchor = new Date(2026, 8, 1);

  it("builds all days in a month", () => {
    const days = buildMonthDays(anchor, new Date(2026, 8, 9));
    assert.equal(days.length, 30);
    assert.equal(days[8]?.isToday, true);
    assert.equal(days[5]?.isWeekend, true);
  });

  it("maps reservations to timeline rows", () => {
    const days = buildMonthDays(anchor);
    const rows = buildTimelineRows(
      [
        row("1", new Date(2026, 8, 5, 10, 0, 0).toISOString()),
        row("2", new Date(2026, 8, 20, 11, 30, 0).toISOString()),
      ],
      days,
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.startCol, 4);
  });

  it("places bars on the day grid", () => {
    assert.equal(barGridColumn(2, 4), "4 / span 3");
    assert.equal(barGridColumn(0, 0), "2 / span 1");
  });

  it("labels events by status", () => {
    assert.equal(
      timelineEventTitle("confirmed", "Whitening"),
      "Whitening",
    );
    assert.equal(timelineEventTitle("cancelled", "Whitening"), "Cancelled");
  });

  it("finds day index in range", () => {
    const days = buildMonthDays(anchor);
    const index = dayIndexForDays(
      days,
      new Date(2026, 8, 10, 15, 0, 0).toISOString(),
    );
    assert.equal(index, 9);
  });

  it("filters reservations by status", () => {
    const rows = [
      row("1", new Date(2026, 8, 5, 10, 0, 0).toISOString(), "pending"),
      row("2", new Date(2026, 8, 6, 10, 0, 0).toISOString(), "confirmed"),
    ];
    const pending = filterReservationsForTimeline(rows, "pending");
    assert.equal(pending.length, 1);
    assert.equal(pending[0]?.status, "pending");
  });

  it("builds a monday-first calendar grid", () => {
    const grid = buildCalendarGrid(new Date(2026, 7, 1));
    assert.equal(grid.length % 7, 0);
    assert.equal(grid[0]?.weekday.slice(0, 3), "Mon");
    const inMonth = grid.filter((day) => day.isCurrentMonth);
    assert.equal(inMonth.length, 31);
  });

  it("groups reservations by calendar day", () => {
    const iso = "2026-09-05";
    const map = groupReservationsByDay([
      row("1", new Date(2026, 8, 5, 10, 0, 0).toISOString()),
      row("2", new Date(2026, 8, 5, 14, 0, 0).toISOString()),
    ]);
    assert.equal(map.get(iso)?.length, 2);
  });
});

describe("reservation reschedule", () => {
  it("shifts appointment to another day preserving local time", () => {
    const original = new Date(2026, 8, 5, 14, 30, 0).toISOString();
    const shifted = shiftStartsAtToDate(original, "2026-09-15");
    assert.equal(reservationDayIso(shifted), "2026-09-15");
    const time = new Date(shifted);
    assert.equal(time.getHours(), 14);
    assert.equal(time.getMinutes(), 30);
  });
});

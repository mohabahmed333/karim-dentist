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
  pickCurrentReservation,
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

describe("pickCurrentReservation", () => {
  const at = (hour: number, minute = 0) =>
    new Date(2026, 8, 8, hour, minute, 0).toISOString();
  const row = (
    id: string,
    hour: number,
    over: Partial<Reservation> = {},
  ): Reservation =>
    ({ ...base, id, status: "confirmed", starts_at: at(hour), ...over }) as Reservation;

  const nine = row("9am", 9);
  const eleven = row("11am", 11);
  const two = row("2pm", 14);
  const day = [nine, eleven, two];

  it("has nothing to show on an empty day", () => {
    assert.equal(pickCurrentReservation([], new Date(2026, 8, 8, 10)), null);
  });

  it("picks the appointment that just started", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 9, 0, 0));
    assert.equal(out?.id, "9am");
  });

  it("keeps the appointment until its slot runs out", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 9, 59, 59, 999));
    assert.equal(out?.id, "9am");
  });

  it("moves on the moment the slot ends", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 10, 0, 0));
    assert.equal(out?.id, "11am");
  });

  it("looks ahead to the next one in a gap", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 10, 30, 0));
    assert.equal(out?.id, "11am");
  });

  it("shows the first appointment before the day starts", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 7, 0, 0));
    assert.equal(out?.id, "9am");
  });

  it("stays on the last appointment once the day is over", () => {
    const out = pickCurrentReservation(day, new Date(2026, 8, 8, 19, 0, 0));
    assert.equal(out?.id, "2pm");
  });

  it("prefers the later start when two appointments overlap", () => {
    const double = [nine, row("9am-again", 9, { id: "9am-again" })];
    const out = pickCurrentReservation(double, new Date(2026, 8, 8, 9, 30, 0));
    assert.equal(out?.id, "9am-again");
  });

  it("ignores a cancelled appointment even mid-slot", () => {
    const rows = [row("cancelled", 9, { id: "cancelled", status: "cancelled" }), eleven];
    const out = pickCurrentReservation(rows, new Date(2026, 8, 8, 9, 30, 0));
    assert.equal(out?.id, "11am");
  });

  it("ignores a deleted appointment even mid-slot", () => {
    const rows = [
      row("deleted", 9, { id: "deleted", deleted_at: "2026-09-07T00:00:00.000Z" }),
      eleven,
    ];
    const out = pickCurrentReservation(rows, new Date(2026, 8, 8, 9, 30, 0));
    assert.equal(out?.id, "11am");
  });

  it("still shows a completed appointment — it may not be billed yet", () => {
    const rows = [row("done", 9, { id: "done", status: "completed" }), eleven];
    const out = pickCurrentReservation(rows, new Date(2026, 8, 8, 9, 30, 0));
    assert.equal(out?.id, "done");
  });

  it("ignores another day's appointments", () => {
    const tomorrow = {
      ...base,
      id: "tomorrow",
      status: "confirmed",
      starts_at: new Date(2026, 8, 9, 9, 0, 0).toISOString(),
    } as Reservation;
    assert.equal(
      pickCurrentReservation([tomorrow], new Date(2026, 8, 8, 9, 30, 0)),
      null,
    );
  });
});

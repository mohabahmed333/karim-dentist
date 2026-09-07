import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  buildReservationStats,
  countReservationsForDay,
  filterReservationsByStatus,
} from "./stats.ts";
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
  status: Reservation["status"],
  serviceLabel = "General consultation",
): Reservation {
  return { ...base, id, starts_at: startsAt, status, service_label: serviceLabel };
}

describe("reservation stats", () => {
  const now = new Date(2026, 8, 2, 12, 0, 0);

  it("counts reservations for a day", () => {
    const reservations = [
      row("1", new Date(2026, 8, 2, 10, 0, 0).toISOString(), "pending"),
      row("2", new Date(2026, 8, 1, 10, 0, 0).toISOString(), "confirmed"),
    ];
    assert.equal(countReservationsForDay(reservations, now), 1);
  });

  it("builds overview stats", () => {
    const reservations = [
      row("1", new Date(2026, 8, 2, 10, 0, 0).toISOString(), "pending"),
      row("2", new Date(2026, 8, 2, 11, 30, 0).toISOString(), "confirmed"),
      row("3", new Date(2026, 8, 1, 10, 0, 0).toISOString(), "completed"),
      row("4", new Date(2026, 8, 3, 10, 0, 0).toISOString(), "pending", "Whitening"),
    ];
    const stats = buildReservationStats(reservations, now);
    assert.equal(stats.todayCount, 2);
    assert.equal(stats.yesterdayCount, 1);
    assert.equal(stats.pendingCount, 2);
    assert.equal(stats.weekCounts.length, 7);
    assert.ok(stats.serviceMix.length >= 2);
  });

  it("filters upcoming reservations", () => {
    const reservations = [
      row("1", new Date(2026, 8, 2, 10, 0, 0).toISOString(), "pending"),
      row("2", new Date(2026, 8, 5, 10, 0, 0).toISOString(), "confirmed"),
      row("3", new Date(2026, 8, 1, 10, 0, 0).toISOString(), "cancelled"),
    ];
    const upcoming = filterReservationsByStatus(reservations, "upcoming", now);
    assert.equal(upcoming.length, 1);
    assert.equal(upcoming[0]?.id, "2");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  buildPatientHistoryStats,
  buildPatientHistoryDetail,
  decodePatientKey,
  encodePatientKey,
  filterPatientGroups,
  findPatientGroupByPhone,
  groupReservationsByPatient,
  normalizePhone,
  patientKeyFromReservation,
  phonesMatch,
} from "./patientHistory.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildMonthDays, buildPatientTimelineRows } from "./timeline.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import type { Reservation } from "./types.ts";

const base: Omit<Reservation, "id" | "starts_at" | "status" | "service_label" | "patient_name" | "phone"> = {
  email: null,
  service_id: null,
  notes: "",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

function row(
  id: string,
  patientName: string,
  phone: string,
  startsAt: string,
  status: Reservation["status"] = "confirmed",
): Reservation {
  return {
    ...base,
    id,
    patient_name: patientName,
    phone,
    starts_at: startsAt,
    status,
    service_label: "General consultation",
  };
}

describe("patient history", () => {
  it("normalizes phone numbers", () => {
    assert.equal(normalizePhone("+20 100 123 4567"), "+201001234567");
    assert.equal(normalizePhone("0100-123-4567"), "01001234567");
    assert.equal(normalizePhone("  "), "");
  });

  it("groups visits by phone", () => {
    const groups = groupReservationsByPatient([
      row("1", "Ahmed Hassan", "+20 100 111 1111", "2026-09-05T10:00:00.000Z"),
      row("2", "Ahmed H.", "+20 100 111 1111", "2026-09-20T11:00:00.000Z"),
      row("3", "Sara Ali", "+20 100 222 2222", "2026-09-10T10:00:00.000Z"),
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0]?.visits.length, 2);
    assert.equal(groups[0]?.alternateNames.length, 1);
  });

  it("matches Egypt WhatsApp digits to reservation phone formats", () => {
    const groups = groupReservationsByPatient([
      row("1", "mohab", "+201113169597", "2026-09-05T10:00:00.000Z"),
      row("2", "mohab", "01113169597", "2026-09-10T10:00:00.000Z"),
      row("3", "Sara", "+20 100 222 2222", "2026-09-10T10:00:00.000Z"),
    ]);
    assert.equal(groups.length, 2);
    const match = findPatientGroupByPhone(groups, "201113169597");
    assert.ok(match);
    assert.equal(match?.displayName, "mohab");
    assert.ok(phonesMatch("+201113169597", "01113169597"));
  });

  it("detects returning patients and upcoming visits", () => {
    const now = new Date(2026, 8, 15);
    const groups = groupReservationsByPatient([
      row("1", "Ahmed", "+20 100 111 1111", "2026-09-05T10:00:00.000Z"),
      row("2", "Ahmed", "+20 100 111 1111", "2026-09-25T10:00:00.000Z"),
    ]);
    const stats = buildPatientHistoryStats(groups[0]!, now);
    assert.equal(stats.isReturning, true);
    assert.equal(stats.hasUpcoming, true);
    assert.ok(stats.lastVisit);
    assert.ok(stats.nextVisit);
  });

  it("filters patient groups", () => {
    const groups = groupReservationsByPatient([
      row("1", "Ahmed", "+20 100 111 1111", "2026-09-25T10:00:00.000Z"),
      row("2", "Sara", "+20 100 222 2222", "2026-09-10T10:00:00.000Z"),
    ]);
    const now = new Date(2026, 8, 1);
    assert.equal(filterPatientGroups(groups, "new", "", now).length, 2);
    assert.equal(filterPatientGroups(groups, "returning", "", now).length, 0);
    assert.equal(
      filterPatientGroups(groups, "all", "sara", now).length,
      1,
    );
  });

  it("builds patient timeline rows with lanes for same day", () => {
    const days = buildMonthDays(new Date(2026, 8, 1));
    const sameDay = new Date(2026, 8, 5, 10, 0, 0).toISOString();
    const groups = groupReservationsByPatient([
      row("1", "Ahmed", "+20 100 111 1111", sameDay),
      row("2", "Ahmed", "+20 100 111 1111", sameDay),
      row("3", "Ahmed", "+20 100 111 1111", "2026-09-12T10:00:00.000Z"),
    ]);
    const rows = buildPatientTimelineRows(groups, days);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.visits.length, 3);
    const sameDayVisits = rows[0]!.visits.filter((v) => v.startCol === 4);
    assert.equal(sameDayVisits.length, 2);
    assert.equal(sameDayVisits[0]?.lane, 0);
    assert.equal(sameDayVisits[1]?.lane, 1);
  });

  it("encodes patient keys for urls", () => {
    const key = patientKeyFromReservation(
      row("1", "Ahmed", "+20 100 111 1111", "2026-09-05T10:00:00.000Z"),
    );
    assert.equal(decodePatientKey(encodePatientKey(key)), key);
  });

  it("builds full patient history detail", () => {
    const groups = groupReservationsByPatient([
      row("1", "Ahmed", "+20 100 111 1111", "2026-08-01T10:00:00.000Z"),
      row("2", "Ahmed", "+20 100 111 1111", "2026-09-25T10:00:00.000Z"),
      row("3", "Ahmed", "+20 100 111 1111", "2026-07-01T10:00:00.000Z", "cancelled"),
    ]);
    const detail = buildPatientHistoryDetail(groups[0]!, new Date(2026, 8, 15));
    assert.equal(detail.stats.visitCount, 3);
    assert.equal(detail.services.length, 1);
    assert.equal(detail.cancelledVisits.length, 1);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { findOpenReservationForPatient } from "./receptionHelpers.ts";
import type { Reservation } from "@/services/reservations/types";

function row(
  partial: Partial<Reservation> &
    Pick<Reservation, "id" | "phone" | "starts_at" | "status">,
): Reservation {
  return {
    patient_name: "Sara",
    email: null,
    service_id: null,
    service_label: "Checkup",
    notes: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    ...partial,
  } as Reservation;
}

describe("findOpenReservationForPatient", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");

  it("returns null when patient has no open upcoming booking", () => {
    const found = findOpenReservationForPatient(
      [
        row({
          id: "1",
          phone: "01001234567",
          starts_at: "2026-09-01T10:00:00.000Z",
          status: "completed",
        }),
        row({
          id: "2",
          phone: "01001234567",
          starts_at: "2026-09-20T10:00:00.000Z",
          status: "cancelled",
        }),
      ],
      { patientKey: "phone:201001234567", phone: "01001234567" },
      now,
    );
    assert.equal(found, null);
  });

  it("returns the soonest pending/confirmed upcoming reservation", () => {
    const found = findOpenReservationForPatient(
      [
        row({
          id: "later",
          phone: "01001234567",
          starts_at: "2026-09-20T10:00:00.000Z",
          status: "confirmed",
        }),
        row({
          id: "soon",
          phone: "+20 100 123 4567",
          starts_at: "2026-09-10T10:00:00.000Z",
          status: "pending",
        }),
        row({
          id: "other",
          phone: "01009999999",
          starts_at: "2026-09-09T10:00:00.000Z",
          status: "pending",
        }),
      ],
      { patientKey: "wa:01001234567", phone: "01001234567" },
      now,
    );
    assert.equal(found?.id, "soon");
  });
});

import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { groupReservationsNextThreeDays } from "./reservationsTodayRail.ts";
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

test("groupReservationsNextThreeDays keeps today tomorrow and day after", () => {
  const now = new Date(2026, 8, 8, 12, 0, 0);
  const groups = groupReservationsNextThreeDays(
    [
      {
        ...base,
        id: "t",
        status: "confirmed",
        starts_at: new Date(2026, 8, 8, 10, 0, 0).toISOString(),
      },
      {
        ...base,
        id: "tm",
        status: "pending",
        starts_at: new Date(2026, 8, 9, 11, 0, 0).toISOString(),
      },
      {
        ...base,
        id: "at",
        status: "confirmed",
        starts_at: new Date(2026, 8, 10, 9, 0, 0).toISOString(),
      },
      {
        ...base,
        id: "later",
        status: "confirmed",
        starts_at: new Date(2026, 8, 11, 9, 0, 0).toISOString(),
      },
    ],
    now,
  );
  assert.deepEqual(
    groups.map((g) => [g.key, g.items.map((r) => r.id)]),
    [
      ["today", ["t"]],
      ["tomorrow", ["tm"]],
      ["afterTomorrow", ["at"]],
    ],
  );
});

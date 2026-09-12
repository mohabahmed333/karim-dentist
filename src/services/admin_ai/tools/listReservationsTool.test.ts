import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../testing/fakeDb.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { listReservationsTool, listReservationsToolArgs } from "./listReservationsTool.ts";

const IN_RANGE = {
  id: "r1",
  patient_name: "Ali",
  phone: "+2010",
  service_label: "Cleaning",
  starts_at: "2026-09-15T08:00:00.000Z", // 11:00 Cairo, well inside the 15th
  status: "confirmed",
  deleted_at: null,
};
const NEXT_DAY = {
  ...IN_RANGE,
  id: "r2",
  patient_name: "Mona",
  starts_at: "2026-09-15T22:00:00.000Z", // 01:00 Cairo on the 16th
};
const CANCELLED = { ...IN_RANGE, id: "r3", patient_name: "Sara", status: "cancelled" };

describe("listReservationsTool", () => {
  it("lists reservations within a single clinic-local day", async () => {
    const db = createFakeDb({ tables: { reservations: [IN_RANGE, NEXT_DAY] } });
    const out = await listReservationsTool(
      db as never,
      listReservationsToolArgs.parse({ from: "2026-09-15" }),
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]?.reservationId, "r1");
  });

  it("spans an inclusive from/to range", async () => {
    const db = createFakeDb({ tables: { reservations: [IN_RANGE, NEXT_DAY] } });
    const out = await listReservationsTool(
      db as never,
      listReservationsToolArgs.parse({ from: "2026-09-15", to: "2026-09-16" }),
    );
    assert.equal(out.length, 2);
  });

  it("filters by status when given", async () => {
    const db = createFakeDb({ tables: { reservations: [IN_RANGE, CANCELLED] } });
    const out = await listReservationsTool(
      db as never,
      listReservationsToolArgs.parse({ from: "2026-09-15", status: "cancelled" }),
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]?.reservationId, "r3");
  });

  it("rejects a malformed date", () => {
    assert.throws(() => listReservationsToolArgs.parse({ from: "15-09-2026" }));
  });
});

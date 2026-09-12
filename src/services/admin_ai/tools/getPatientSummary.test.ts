import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../testing/fakeDb.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { getPatientSummary, getPatientSummaryArgs } from "./getPatientSummary.ts";

const PAST = {
  id: "r1",
  patient_name: "Ali Hassan",
  phone: "+201001234567",
  email: null,
  service_label: "Cleaning",
  starts_at: "2026-08-01T10:00:00.000Z",
  status: "completed",
  deleted_at: null,
};
const UPCOMING = {
  ...PAST,
  id: "r2",
  service_label: "Filling",
  starts_at: "2026-09-20T10:00:00.000Z",
  status: "confirmed",
};
const NOW = new Date("2026-09-12T00:00:00.000Z");

describe("getPatientSummary", () => {
  it("summarises an existing patient's history", async () => {
    const db = createFakeDb({ tables: { reservations: [PAST, UPCOMING] } });
    const out = await getPatientSummary(
      db as never,
      getPatientSummaryArgs.parse({ patientKey: "phone:201001234567" }),
      NOW,
    );
    assert.equal(out.found, true);
    if (!out.found) return;
    assert.equal(out.name, "Ali Hassan");
    assert.equal(out.visitCount, 2);
    assert.equal(out.upcomingVisits[0]?.reservationId, "r2");
    assert.equal(out.pastVisits[0]?.reservationId, "r1");
    assert.deepEqual(out.topServices[0], { label: "Cleaning", count: 1 });
  });

  it("reports not found for an unknown patientKey rather than throwing", async () => {
    const db = createFakeDb({ tables: { reservations: [PAST] } });
    const out = await getPatientSummary(
      db as never,
      getPatientSummaryArgs.parse({ patientKey: "phone:20000000000" }),
      NOW,
    );
    assert.deepEqual(out, { found: false });
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildShowreelDemoClinical } from "./buildShowreelDemoClinical.ts";
import { buildShowreelReservations } from "./buildShowreelReservations.ts";

describe("buildShowreelDemoClinical", () => {
  it("targets Nour — the schedule patient with imaging and notes", () => {
    const demo = buildShowreelDemoClinical();
    assert.equal(demo.patientKey, "phone:201111000003");
    assert.ok(demo.imaging.length >= 1);
    assert.ok(demo.notes.length >= 1);
  });

  it("includes required treatments so the EHR ledger is not empty", () => {
    const demo = buildShowreelDemoClinical();
    const open = demo.treatments.filter(
      (t) => t.status === "open" || t.status === "scheduled",
    );
    assert.ok(open.length >= 1);
    assert.equal(open[0]?.toothFdi, "16");
  });

  it("pairs with multiple Nour visits for patient history", () => {
    const visits = buildShowreelReservations().filter(
      (r) => r.phone === "+201111000003",
    );
    assert.ok(visits.length >= 3);
  });
});

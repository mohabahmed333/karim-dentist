import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  cdtPhaseFromId,
  phaseIdFromCdt,
  proceduresFromTreatments,
  proceduresInPhase,
  toProcedureItem,
} from "./plannerState.ts";
import type { ProcedureSource } from "./plannerState.ts";

function row(over: Partial<ProcedureSource> = {}): ProcedureSource {
  return {
    id: "t1",
    toothName: "Upper right first molar",
    toothFdi: "16",
    lastTreatment: "Crown, porcelain/ceramic",
    cdtCode: "D2740",
    phase: "prosthodontic",
    feeAmount: 9000,
    status: "open",
    appointmentStartsAt: null,
    ...over,
  };
}

describe("toProcedureItem", () => {
  it("maps a crown onto Planned Care with the doctor fee", () => {
    assert.deepEqual(toProcedureItem(row(), "fdi"), {
      id: "t1",
      cdtCode: "D2740",
      description: "Crown, porcelain/ceramic",
      toothNumber: "16",
      phaseId: "planned",
      fee: 9000,
      status: "open",
      appointmentLabel: null,
    });
  });

  it("uses a dash when CDT is missing", () => {
    const item = toProcedureItem(row({ cdtCode: null, lastTreatment: "" }), "fdi");
    assert.equal(item.cdtCode, "-");
    assert.equal(item.description, "Upper right first molar");
  });

  it("shows a booked appointment label when scheduled", () => {
    const item = toProcedureItem(
      row({
        status: "scheduled",
        appointmentStartsAt: "2026-09-05T10:00:00.000Z",
      }),
      "fdi",
    );
    assert.equal(item.status, "scheduled");
    assert.ok(item.appointmentLabel);
  });
});

describe("proceduresFromTreatments", () => {
  it("groups a crown into Planned and an extraction into Immediate", () => {
    const procedures = proceduresFromTreatments(
      [row(), row({ id: "t2", phase: "urgent", cdtCode: "D7140" })],
      "fdi",
    );
    assert.equal(proceduresInPhase(procedures, "planned").length, 1);
    assert.equal(proceduresInPhase(procedures, "immediate")[0]?.id, "t2");
  });

  it("strips markup from the description", () => {
    const item = toProcedureItem(
      row({ lastTreatment: "<p>Crown, porcelain/ceramic</p>" }),
      "fdi",
    );
    assert.equal(item.description, "Crown, porcelain/ceramic");
  });
});

describe("care bucket round-trip", () => {
  it("maps stored phases onto Immediate and Planned", () => {
    assert.equal(phaseIdFromCdt("urgent"), "immediate");
    assert.equal(phaseIdFromCdt("restorative"), "planned");
    assert.equal(phaseIdFromCdt("prosthodontic"), "planned");
    assert.equal(cdtPhaseFromId("immediate"), "urgent");
    assert.equal(cdtPhaseFromId("planned"), "restorative");
  });
});

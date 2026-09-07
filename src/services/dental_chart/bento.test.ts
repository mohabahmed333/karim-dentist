import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  filterEncountersByCategory,
  filterLabsByView,
  filterPrescriptionsByGranularity,
  labPipelineStage,
  linkedConditionForRx,
  rangeForVisit,
} from "./bento.ts";

describe("bento panel logic", () => {
  it("links amoxicillin to endodontic infection", () => {
    assert.equal(linkedConditionForRx("rx-amox"), "cond-endo");
  });

  it("narrows rx list for day granularity", () => {
    const rx = [
      {
        id: "rx-amox",
        patientId: "p",
        drugName: "Amoxicillin",
        dosage: "500 mg",
        frequency: "ONCE_DAILY" as const,
        startDate: "2015-10-07",
        endDate: "2015-10-21",
        status: "ACTIVE" as const,
      },
    ];
    const all = filterPrescriptionsByGranularity(rx, { startYear: 2015, endYear: 2016 }, "ALL_TIME");
    assert.equal(all.length, 1);
  });

  it("maps lab percent to five pipeline stages", () => {
    assert.equal(labPipelineStage(83), 3);
    assert.equal(labPipelineStage(100), 4);
  });

  it("builds a single-year range for visit sync", () => {
    assert.deepEqual(rangeForVisit("2015-10-07T00:00:00.000Z"), {
      startYear: 2015,
      endYear: 2015,
    });
  });

  it("filters visits by endodontic category", () => {
    const visits = filterEncountersByCategory(
      [
        {
          id: "e1",
          patientId: "p",
          timestamp: "2015-10-12T00:00:00.000Z",
          type: "PULPECTOMY",
          toothNumbers: [14],
          providerId: "dr",
          notes: "",
          conditionIds: ["cond-endo"],
          graphAnchor: "vitality",
        },
      ],
      ["ENDODONTIC"],
    );
    assert.equal(visits.length, 1);
    assert.equal(filterLabsByView([], "IN_PROGRESS").length, 0);
  });
});

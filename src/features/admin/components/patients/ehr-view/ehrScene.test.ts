import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildEhrSceneEdges, linkedMediaFor, plainText } from "./ehrScene.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildEhrModel } from "./buildEhrModel.ts";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";

const group: PatientGroup = {
  patientKey: "ahmed",
  displayName: "Ahmed Hassan",
  phone: "+201001111111",
  email: null,
  alternateNames: [],
  visits: [
    {
      id: "v1",
      patient_name: "Ahmed Hassan",
      phone: "+201001111111",
      email: null,
      service_id: null,
      service_label: "Composite",
      notes: "",
      status: "confirmed",
      starts_at: "2026-09-05T10:00:00.000Z",
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
      deleted_at: null,
    },
  ],
};

function treatment(id: string, toothName: string, fdi: string): TreatmentItem {
  return {
    id,
    toothName,
    toothFdi: fdi,
    severity: "Minor",
    lastTreatment: "Resin composite, three surfaces posterior",
    status: "scheduled",
    reservationId: null,
    cdtCode: "D2393",
    phase: "restorative",
    feeAmount: 2500,
    createdAt: "2026-09-01T00:00:00.000Z",
    attachments: [],
  };
}

describe("clinical EHR scene", () => {
  it("does not draw graph edges onto the workspace", () => {
    const edges = buildEhrSceneEdges({
      conditionIds: ["t1", "t2"],
      activeConditionId: "t1",
      noteIds: ["n1"],
      propIds: ["p1"],
      mediaIds: ["m1"],
      visitId: "v1",
      expanded: true,
    });
    assert.deepEqual(edges, []);
  });

  it("keeps tooth name and FDI as separate fields so the list can wrap", () => {
    const model = buildEhrModel(
      [treatment("t1", "Lower left lateral incisor", "72")],
      group,
      [],
      [],
    );
    const row = model.conditions[0];
    assert.equal(row?.toothName, "Lower left lateral incisor");
    assert.equal(row?.fdi, "72");
    assert.ok(!row?.toothName.includes("#72"));
  });

  it("prefers treatment attachments over visit fallback media", () => {
    const media = linkedMediaFor(
      {
        attachments: [
          {
            id: "a1",
            kind: "image",
            file_url: "https://cdn.example/before.jpg",
          },
          {
            id: "a2",
            kind: "image",
            file_url: "https://cdn.example/after.jpg",
          },
        ],
      },
      "v1",
      [
        {
          id: "fallback",
          visitId: "v1",
          label: "Imaging - 1",
          dateLabel: "04.09.2026",
          index: 1,
          variant: "light",
          urls: ["https://cdn.example/other.jpg"],
        },
      ],
    );
    assert.equal(media.length, 2);
    assert.equal(media[0]?.urls[0], "https://cdn.example/before.jpg");
  });

  it("strips html from clinical note previews", () => {
    assert.equal(plainText("<p>O: PD DF2</p>"), "O: PD DF2");
  });
});

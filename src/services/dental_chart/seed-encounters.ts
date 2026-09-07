import type { DiagnosticMedia, Encounter, LabOrder } from "./types";

export function seedEncounters(patientId: string): Encounter[] {
  return [
    {
      id: "enc-pulpectomy",
      patientId,
      timestamp: "2015-10-12T10:00:00.000Z",
      type: "PULPECTOMY",
      toothNumbers: [14],
      providerId: "dr-karim",
      notes: "Root Canal Note - Hospitalization",
      conditionIds: ["cond-endo"],
      graphAnchor: "vitality",
    },
    {
      id: "enc-perio",
      patientId,
      timestamp: "2015-10-07T09:00:00.000Z",
      type: "PERIO_PROBING",
      toothNumbers: [14, 19],
      providerId: "dr-karim",
      notes: "",
      conditionIds: ["cond-endo", "cond-perio", "cond-recession"],
      graphAnchor: "perio",
    },
    {
      id: "enc-cbct",
      patientId,
      timestamp: "2015-10-07T11:00:00.000Z",
      type: "CBCT_SCAN",
      toothNumbers: [14],
      providerId: "dr-karim",
      notes: "",
      conditionIds: ["cond-endo", "cond-abscess", "cond-implant"],
      graphAnchor: "cbct",
    },
    {
      id: "enc-crown",
      patientId,
      timestamp: "2015-10-19T13:00:00.000Z",
      type: "CROWN_PREP",
      toothNumbers: [14],
      providerId: "dr-karim",
      notes: "Crown prep after pulpectomy stage 1.",
      conditionIds: ["cond-endo", "cond-fracture-8"],
      graphAnchor: "note",
    },
  ];
}

export function seedMedia(): DiagnosticMedia[] {
  return [
    {
      id: "media-cbct-14",
      encounterId: "enc-cbct",
      mediaType: "CBCT_3D",
      quadrantUrls: ["q1", "q2", "q3", "q4"],
      findings: "Periapical radiolucency tooth #14.",
    },
  ];
}

export function seedLabs(patientId: string): LabOrder[] {
  return [
    {
      id: "lab-zirconia-14",
      patientId,
      toothNumber: 14,
      applianceType: "ZIRCONIA_CROWN",
      status: "FABRICATION",
      progressPercent: 83,
      updatedAt: "2015-10-18T08:00:00.000Z",
    },
  ];
}

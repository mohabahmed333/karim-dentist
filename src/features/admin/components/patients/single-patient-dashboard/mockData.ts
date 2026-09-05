import type { MockPatient, Treatment } from "./types";

export const MOCK_PATIENT: MockPatient = {
  name: "Sara Hassan",
  age: 34,
  balance: 1280,
  hasMedicalAlert: true,
};

export const MOCK_TREATMENTS: Treatment[] = [
  {
    id: "tx-seed-1",
    tooth: 3,
    cdtCode: "D2391",
    procedureName: "Resin-based composite — one surface",
    severity: "Minor",
    fee: 180,
  },
  {
    id: "tx-seed-2",
    tooth: 19,
    cdtCode: "D2740",
    procedureName: "Crown — porcelain/ceramic",
    severity: "Critical",
    fee: 1200,
  },
];

import type { Prescription } from "./types";

export function seedPrescriptions(patientId: string): Prescription[] {
  return [
    {
      id: "rx-amox",
      patientId,
      drugName: "Amoxicillin",
      dosage: "500 mg",
      frequency: "ONCE_DAILY",
      startDate: "2015-10-07",
      endDate: "2015-10-21",
      status: "ACTIVE",
    },
    {
      id: "rx-ibu",
      patientId,
      drugName: "Ibuprofen",
      dosage: "600 mg",
      frequency: "TWICE_DAILY",
      startDate: "2015-10-07",
      endDate: "2015-10-21",
      status: "ACTIVE",
    },
    {
      id: "rx-chx",
      patientId,
      drugName: "Chlorhexidine Rinse",
      dosage: "0.12%",
      frequency: "NIGHT_ONLY",
      startDate: "2015-10-07",
      endDate: "2015-10-21",
      status: "ACTIVE",
    },
  ];
}

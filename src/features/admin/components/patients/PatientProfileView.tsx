"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import { SinglePatient3DDashboard } from "./single-patient-dashboard/SinglePatient3DDashboard";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
};

export function PatientProfileView({
  group,
  imaging,
  treatments,
}: Props) {
  return (
    <SinglePatient3DDashboard
      group={group}
      treatments={treatments}
      imaging={imaging}
    />
  );
}

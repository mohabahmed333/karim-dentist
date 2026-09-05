"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import { SinglePatientDashboard } from "./single-patient-dashboard";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
};

export function PatientProfileView(_props: Props) {
  return <SinglePatientDashboard />;
}

import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";

/** Offline clinical payload for showreel clinic drawer. */
export type AdminDemoClinical = {
  patientKey: string;
  imaging: PatientImaging[];
  notes: PatientToothNote[];
  treatments: TreatmentItem[];
};

/** Use fixture clinical rows only when the open patient matches. */
export function demoClinicalForPatient(
  demo: AdminDemoClinical | null | undefined,
  patientKey: string | null,
): Pick<AdminDemoClinical, "imaging" | "notes" | "treatments"> | null {
  if (!demo || !patientKey || demo.patientKey !== patientKey) return null;
  return {
    imaging: demo.imaging,
    notes: demo.notes,
    treatments: demo.treatments,
  };
}

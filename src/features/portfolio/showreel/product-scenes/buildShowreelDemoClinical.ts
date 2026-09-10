import type { AdminDemoClinical } from "@/features/admin/lib/adminDemoClinical";
import { toTreatmentItem } from "@/services/patient_treatments/types";
import {
  buildShowreelClinicalImaging,
  buildShowreelClinicalNotes,
  buildShowreelClinicalTreatments,
} from "./buildShowreelClinicalWorkspace";

/** Clinical payload for Day Schedule → clinic drawer in the showreel. */
export function buildShowreelDemoClinical(): AdminDemoClinical {
  return {
    patientKey: "phone:201111000003",
    imaging: buildShowreelClinicalImaging(),
    notes: buildShowreelClinicalNotes(),
    treatments: buildShowreelClinicalTreatments().map(toTreatmentItem),
  };
}

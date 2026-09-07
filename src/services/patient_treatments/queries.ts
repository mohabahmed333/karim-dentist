import { createClient } from "@/lib/supabase/client";
import type { PatientTreatment, PatientTreatmentRow } from "./types";

const TREATMENT_SELECT =
  "*, reservation:reservations(*), patient_treatment_attachments(*)";

export async function listPatientTreatments(
  patientKey: string,
): Promise<PatientTreatmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .select(TREATMENT_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientTreatmentRow[];
}

export async function listPatientTreatmentsServer(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  patientKey: string,
): Promise<PatientTreatmentRow[]> {
  const { data, error } = await supabase
    .from("patient_treatments")
    .select(TREATMENT_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientTreatmentRow[];
}

export type { PatientTreatment };

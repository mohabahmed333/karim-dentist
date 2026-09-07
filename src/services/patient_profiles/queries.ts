import { createClient } from "@/lib/supabase/client";
import type { PatientProfile } from "./types";

export async function getPatientProfile(
  patientKey: string,
): Promise<PatientProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_profiles")
    .select("*")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (error) throw error;
  return data as PatientProfile | null;
}

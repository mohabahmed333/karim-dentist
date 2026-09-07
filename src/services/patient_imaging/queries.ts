import { createClient } from "@/lib/supabase/client";
import type { PatientImaging } from "./types";

export async function listPatientImaging(
  patientKey: string,
): Promise<PatientImaging[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_imaging")
    .select("*")
    .eq("patient_key", patientKey)
    .order("taken_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientImaging[];
}

export async function listPatientImagingServer(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  patientKey: string,
): Promise<PatientImaging[]> {
  const { data, error } = await supabase
    .from("patient_imaging")
    .select("*")
    .eq("patient_key", patientKey)
    .order("taken_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientImaging[];
}

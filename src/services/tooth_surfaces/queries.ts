import { createClient } from "@/lib/supabase/client";
import type { PatientToothSurface } from "./types";

export async function listToothSurfaces(
  patientKey: string,
): Promise<PatientToothSurface[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_tooth_surfaces")
    .select("*")
    .eq("patient_key", patientKey);
  if (error) throw error;
  return (data ?? []) as PatientToothSurface[];
}

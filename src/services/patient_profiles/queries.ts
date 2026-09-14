import { createClient } from "@/lib/supabase/client";
import { sanitizeIlike } from "@/services/reservations/listFilters";
import type { PatientProfile, PatientSearchResult } from "./types";

export async function getPatientProfile(
  patientKey: string,
): Promise<PatientProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (error) throw error;
  return data as PatientProfile | null;
}

export async function searchPatients(
  query: string,
  limit = 8,
): Promise<PatientSearchResult[]> {
  const term = sanitizeIlike(query);
  if (!term) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_key, display_name, phone, email")
    .or(`display_name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("display_name", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

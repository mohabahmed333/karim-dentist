import type { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import { sanitizeIlike } from "@/services/reservations/listFilters";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientProfile, PatientSearchResult } from "./types";

type ServerClient = Awaited<ReturnType<typeof createServerClient>>;

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

/** For pages that resolve a `[patientKey]` route param via reservation
 * history — falls back to the `patients` table for a patient with zero
 * visits (e.g. one added directly, never yet booked). */
export async function resolvePatientDirectoryGroupFallback(
  supabase: ServerClient,
  patientKey: string,
): Promise<PatientGroup | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("patient_key, display_name, phone, email")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    patientKey: data.patient_key,
    displayName: data.display_name,
    phone: data.phone,
    email: data.email,
    alternateNames: [],
    visits: [],
  };
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

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import {
  clinicalNoteInsertSchema,
  type ClinicalNoteInsert,
} from "@/services/admin_ai/clinicalPayloads";

export type PatientClinicalNoteRow = Tables<"patient_clinical_notes">;

export async function listPatientClinicalNotes(
  patientKey: string,
): Promise<PatientClinicalNoteRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_clinical_notes")
    .select("*")
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientClinicalNoteRow[];
}

export async function createPatientClinicalNote(
  input: ClinicalNoteInsert,
): Promise<PatientClinicalNoteRow> {
  const parsed = clinicalNoteInsertSchema.parse(input);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_clinical_notes")
    .insert(parsed)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientClinicalNoteRow;
}

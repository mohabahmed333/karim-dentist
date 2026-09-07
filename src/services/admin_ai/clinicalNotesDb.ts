import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";
import {
  clinicalNoteInsertSchema,
  type ClinicalNoteInsert,
} from "./clinicalPayloads";

export type PatientClinicalNote = Tables<"patient_clinical_notes">;
type Db = SupabaseClient<Database>;

export async function listClinicalNotes(
  db: Db,
  patientKey: string,
): Promise<PatientClinicalNote[]> {
  const { data, error } = await db
    .from("patient_clinical_notes")
    .select("*")
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientClinicalNote[];
}

export async function createClinicalNote(
  db: Db,
  input: ClinicalNoteInsert,
  createdBy?: string | null,
): Promise<PatientClinicalNote> {
  const parsed = clinicalNoteInsertSchema.parse(input);
  const { data, error } = await db
    .from("patient_clinical_notes")
    .insert({
      ...parsed,
      created_by: createdBy ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientClinicalNote;
}

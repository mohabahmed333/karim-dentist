import { createClient } from "@/lib/supabase/client";
import type { PatientToothNote } from "./types";

const NOTE_SELECT =
  "*, patient_tooth_note_attachments(id, note_id, file_url, file_name, mime_type, kind, created_at)";

export async function listToothNotes(
  patientKey: string,
): Promise<PatientToothNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_tooth_notes")
    .select(NOTE_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    patient_tooth_note_attachments:
      row.patient_tooth_note_attachments ?? [],
  })) as PatientToothNote[];
}

export async function listToothNotesServer(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  patientKey: string,
): Promise<PatientToothNote[]> {
  const { data, error } = await supabase
    .from("patient_tooth_notes")
    .select(NOTE_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    patient_tooth_note_attachments:
      row.patient_tooth_note_attachments ?? [],
  })) as PatientToothNote[];
}

export function notesForFdi(
  notes: PatientToothNote[],
  fdi: string,
): PatientToothNote[] {
  return notes.filter((row) => row.fdi_number === fdi);
}

export function teethWithNotes(notes: PatientToothNote[]): Set<string> {
  return new Set(notes.map((row) => row.fdi_number));
}

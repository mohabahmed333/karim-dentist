import { createClient } from "@/lib/supabase/client";
import type { AttachmentInput, PatientToothNote } from "./types";

const NOTE_SELECT =
  "*, patient_tooth_note_attachments(id, note_id, file_url, file_name, mime_type, kind, created_at)";

export async function createToothNote(
  patientKey: string,
  fdiNumber: string,
  body: string,
  attachments: AttachmentInput[] = [],
): Promise<PatientToothNote> {
  const supabase = createClient();
  const { data: note, error } = await supabase
    .from("patient_tooth_notes")
    .insert({ patient_key: patientKey, fdi_number: fdiNumber, body })
    .select()
    .single();
  if (error) throw error;

  if (attachments.length > 0) {
    const { error: attachError } = await supabase
      .from("patient_tooth_note_attachments")
      .insert(
        attachments.map((row) => ({
          note_id: note.id,
          file_url: row.file_url,
          file_name: row.file_name,
          mime_type: row.mime_type,
          kind: row.kind,
        })),
      );
    if (attachError) throw attachError;
  }

  const { data, error: reloadError } = await supabase
    .from("patient_tooth_notes")
    .select(NOTE_SELECT)
    .eq("id", note.id)
    .single();
  if (reloadError) throw reloadError;
  return data as PatientToothNote;
}

export async function updateToothNote(
  noteId: string,
  body: string,
  attachments: AttachmentInput[] = [],
): Promise<PatientToothNote> {
  const supabase = createClient();
  const { error } = await supabase
    .from("patient_tooth_notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", noteId);
  if (error) throw error;

  if (attachments.length > 0) {
    const { error: attachError } = await supabase
      .from("patient_tooth_note_attachments")
      .insert(
        attachments.map((row) => ({
          note_id: noteId,
          file_url: row.file_url,
          file_name: row.file_name,
          mime_type: row.mime_type,
          kind: row.kind,
        })),
      );
    if (attachError) throw attachError;
  }

  const { data, error: reloadError } = await supabase
    .from("patient_tooth_notes")
    .select(NOTE_SELECT)
    .eq("id", noteId)
    .single();
  if (reloadError) throw reloadError;
  return data as PatientToothNote;
}

export async function deleteToothNote(noteId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("patient_tooth_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw error;
}

export async function deleteToothNoteAttachment(
  attachmentId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("patient_tooth_note_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) throw error;
}

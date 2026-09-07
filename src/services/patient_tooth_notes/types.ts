import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export type PatientToothNoteAttachment =
  Tables<"patient_tooth_note_attachments">;
export type PatientToothNote = Tables<"patient_tooth_notes"> & {
  patient_tooth_note_attachments: PatientToothNoteAttachment[];
};

export type AttachmentInput = {
  file_url: string;
  file_name: string;
  mime_type: string;
  kind: "image" | "file";
};

export type PatientToothNoteInsert = TablesInsert<"patient_tooth_notes">;

import { createClient } from "@/lib/supabase/client";
import { createPatientImaging } from "@/services/patient_imaging/mutations";
import type { PatientImaging } from "@/services/patient_imaging";
import type {
  PatientTreatmentAttachment,
  TreatmentAttachmentKind,
} from "./types";
import { uploadTreatmentAttachmentFile } from "./upload";

export type TreatmentAttachmentResult = {
  attachment: PatientTreatmentAttachment;
  imaging: PatientImaging | null;
};

export async function addTreatmentAttachment(
  patientKey: string,
  treatmentId: string,
  file: File,
  asXray: boolean,
  meta: { toothName: string; toothFdi: string | null },
): Promise<TreatmentAttachmentResult> {
  const uploaded = await uploadTreatmentAttachmentFile(
    patientKey,
    treatmentId,
    file,
    asXray,
  );

  let imaging: PatientImaging | null = null;
  if (uploaded.kind === "xray") {
    imaging = await createPatientImaging(patientKey, {
      title: `Treatment · ${meta.toothName}${meta.toothFdi ? ` · ${meta.toothFdi}` : ""}`,
      kind: "xray",
      tooth_number: null,
      file_url: uploaded.file_url,
      file_name: uploaded.file_name,
      mime_type: uploaded.mime_type,
      taken_at: null,
    });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatment_attachments")
    .insert({
      treatment_id: treatmentId,
      file_url: uploaded.file_url,
      file_name: uploaded.file_name,
      mime_type: uploaded.mime_type,
      kind: uploaded.kind,
      imaging_id: imaging?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    attachment: data as PatientTreatmentAttachment,
    imaging,
  };
}

export async function deleteTreatmentAttachment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("patient_treatment_attachments")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export type PendingTreatmentFile = {
  file: File;
  asXray: boolean;
};

export async function uploadPendingTreatmentFiles(
  patientKey: string,
  treatmentId: string,
  pending: PendingTreatmentFile[],
  meta: { toothName: string; toothFdi: string | null },
): Promise<TreatmentAttachmentResult[]> {
  const rows: TreatmentAttachmentResult[] = [];
  for (const item of pending) {
    rows.push(
      await addTreatmentAttachment(
        patientKey,
        treatmentId,
        item.file,
        item.asXray,
        meta,
      ),
    );
  }
  return rows;
}

export type { TreatmentAttachmentKind };

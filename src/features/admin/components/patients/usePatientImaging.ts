"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createPatientImaging,
  deletePatientImaging,
  imagingCreateSchema,
  uploadPatientImagingFile,
  type ImagingKind,
  type PatientImaging,
} from "@/services/patient_imaging";

export type ImagingDraft = {
  title: string;
  kind: ImagingKind;
  toothNumber: string;
  takenAt: string;
  file: File | null;
};

const emptyDraft = (): ImagingDraft => ({
  title: "",
  kind: "xray",
  toothNumber: "",
  takenAt: "",
  file: null,
});

export function usePatientImaging(
  patientKey: string,
  initial: PatientImaging[],
) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<ImagingDraft>(emptyDraft);
  const [pending, setPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const viewer = items.find((row) => row.id === viewerId) ?? null;

  async function upload() {
    if (!draft.file) {
      toast.error("Choose a file to upload");
      return;
    }
    const tooth =
      draft.toothNumber.trim() === ""
        ? null
        : Number.parseInt(draft.toothNumber, 10);
    setPending(true);
    try {
      const uploaded = await uploadPatientImagingFile(patientKey, draft.file);
      const title =
        draft.title.trim() ||
        draft.file.name.replace(/\.[^.]+$/, "") ||
        "X-ray";
      const takenAt = draft.takenAt
        ? new Date(draft.takenAt).toISOString()
        : null;
      const parsed = imagingCreateSchema.safeParse({
        title,
        kind: draft.kind,
        tooth_number: Number.isFinite(tooth) ? tooth : null,
        taken_at: takenAt,
        file_url: uploaded.file_url,
        file_name: uploaded.file_name,
        mime_type: uploaded.mime_type,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Invalid X-ray");
        return;
      }
      const row = await createPatientImaging(patientKey, parsed.data);
      setItems((prev) => [row, ...prev]);
      setDraft(emptyDraft());
      toast.success("X-ray uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setPending(true);
    try {
      await deletePatientImaging(deleteId);
      setItems((prev) => prev.filter((row) => row.id !== deleteId));
      if (viewerId === deleteId) setViewerId(null);
      setDeleteId(null);
      toast.success("X-ray removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  return {
    items,
    draft,
    setDraft,
    pending,
    deleteId,
    setDeleteId,
    viewerId,
    setViewerId,
    viewer,
    upload,
    confirmDelete,
    prepend: (rows: PatientImaging[]) => {
      setItems((prev) => [...rows, ...prev]);
    },
  };
}

"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createPatientTreatment,
  deletePatientTreatment,
  deleteTreatmentAttachment,
  markTreatmentScheduled,
  toTreatmentItem,
  treatmentUpsertSchema,
  updatePatientTreatment,
  updateTreatmentFee,
  updateTreatmentPhase,
  uploadPendingTreatmentFiles,
  type PatientTreatmentRow,
  type TreatmentItem,
  type TreatmentSeverity,
} from "@/services/patient_treatments";
import { cdtAddPayload } from "@/services/cdt";
import type { Reservation } from "@/services/reservations/types";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PendingFile } from "./treatments/TreatmentEditorForm";

export function usePatientTreatments(
  patientKey: string,
  initial: PatientTreatmentRow[],
  onImagingAdded?: (rows: PatientImaging[]) => void,
) {
  const [rows, setRows] = useState(initial);
  const [pending, setPending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<TreatmentSeverity | "All">(
    "All",
  );
  const [editorId, setEditorId] = useState<string | "new" | null>(null);
  const [editorSeed, setEditorSeed] = useState<{
    tooth_fdi: string;
    tooth_name: string;
  } | null>(null);
  const [editorSurface, setEditorSurface] = useState<"drawer" | "wizard">(
    "drawer",
  );
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookMode, setBookMode] = useState<"book" | "replace">("book");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const items: TreatmentItem[] = useMemo(
    () => rows.map(toTreatmentItem),
    [rows],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (severityFilter !== "All" && item.severity !== severityFilter) return false;
      if (!q) return true;
      return (
        item.toothName.toLowerCase().includes(q) ||
        (item.toothFdi ?? "").includes(q)
      );
    });
  }, [items, query, severityFilter]);

  const editing = rows.find((row) => row.id === editorId) ?? null;
  const booking = items.find((item) => item.id === bookId) ?? null;

  function openEditor(
    id: string | "new",
    seed?: { tooth_fdi: string; tooth_name: string } | null,
    surface: "drawer" | "wizard" = "drawer",
  ) {
    setEditorSeed(id === "new" ? (seed ?? null) : null);
    setEditorSurface(surface);
    setEditorId(id);
  }

  function closeEditor() {
    setEditorId(null);
    setEditorSeed(null);
    setEditorSurface("drawer");
  }

  function openBook(id: string, mode: "book" | "replace" = "book") {
    setBookMode(mode);
    setBookId(id);
  }

  async function saveTreatment(raw: unknown, pendingFiles: PendingFile[]) {
    const parsed = treatmentUpsertSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid treatment");
      return null;
    }
    setPending(true);
    try {
      let row: PatientTreatmentRow;
      if (editorId === "new") {
        row = await createPatientTreatment(patientKey, parsed.data);
      } else if (editorId) {
        const updated = await updatePatientTreatment(editorId, parsed.data);
        const prev = rows.find((item) => item.id === updated.id);
        row = {
          ...prev,
          ...updated,
          patient_treatment_attachments:
            prev?.patient_treatment_attachments ?? [],
        };
      } else {
        return null;
      }

      if (pendingFiles.length > 0) {
        const uploaded = await uploadPendingTreatmentFiles(
          patientKey,
          row.id,
          pendingFiles,
          {
            toothName: row.tooth_name,
            toothFdi: row.tooth_fdi,
          },
        );
        row = {
          ...row,
          patient_treatment_attachments: [
            ...(row.patient_treatment_attachments ?? []),
            ...uploaded.map((item) => item.attachment),
          ],
        };
        const imagings = uploaded
          .map((item) => item.imaging)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (imagings.length > 0) onImagingAdded?.(imagings);
      }

      if (editorId === "new") {
        setRows((prev) => [row, ...prev]);
        setExpandedId(row.id);
        toast.success("Treatment added");
        // Stay in wizard edit mode with the new id for further saves / book
        if (editorSurface === "wizard") {
          setEditorId(row.id);
        } else {
          closeEditor();
        }
      } else {
        setRows((prev) =>
          prev.map((item) => (item.id === row.id ? row : item)),
        );
        toast.success("Treatment updated");
        if (editorSurface !== "wizard") {
          closeEditor();
        }
      }
      return row.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function removeAttachment(attachmentId: string) {
    setPending(true);
    try {
      await deleteTreatmentAttachment(attachmentId);
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          patient_treatment_attachments: (
            row.patient_treatment_attachments ?? []
          ).filter((file) => file.id !== attachmentId),
        })),
      );
      toast.success("Attachment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setPending(true);
    try {
      await deletePatientTreatment(deleteId);
      setRows((prev) => prev.filter((row) => row.id !== deleteId));
      if (expandedId === deleteId) setExpandedId(null);
      setDeleteId(null);
      toast.success("Treatment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  async function afterBooked(treatmentId: string, reservation: Reservation) {
    try {
      const row = await markTreatmentScheduled(treatmentId, reservation.id);
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, ...row, reservation } : item,
        ),
      );
    } catch {
      setRows((prev) =>
        prev.map((item) =>
          item.id === treatmentId
            ? {
                ...item,
                status: "scheduled",
                reservation_id: reservation.id,
                reservation,
              }
            : item,
        ),
      );
    }
  }

  async function createTreatmentFromDraft(
    raw: unknown,
    pendingFiles: PendingFile[],
  ) {
    const parsed = treatmentUpsertSchema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid treatment");
      return null;
    }
    setPending(true);
    try {
      const created = await createPatientTreatment(patientKey, parsed.data);
      let row: PatientTreatmentRow = {
        ...created,
        patient_treatment_attachments: [],
      };
      if (pendingFiles.length > 0) {
        const uploaded = await uploadPendingTreatmentFiles(
          patientKey,
          row.id,
          pendingFiles,
          {
            toothName: row.tooth_name,
            toothFdi: row.tooth_fdi,
          },
        );
        row = {
          ...row,
          patient_treatment_attachments: uploaded.map((item) => item.attachment),
        };
        const imagings = uploaded
          .map((item) => item.imaging)
          .filter((item): item is NonNullable<typeof item> => Boolean(item));
        if (imagings.length > 0) onImagingAdded?.(imagings);
      }
      setRows((prev) => [row, ...prev]);
      setExpandedId(row.id);
      toast.success("Required treatment created");
      return row.id;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function addCdtProcedure(fdi: string, code: string, fee: number) {
    const payload = cdtAddPayload(fdi, code, fee);
    if (!payload) {
      toast.error("Unknown CDT code");
      return;
    }
    setPending(true);
    try {
      const row = await createPatientTreatment(patientKey, payload);
      setRows((prev) => [
        { ...row, patient_treatment_attachments: [] },
        ...prev,
      ]);
      toast.success(`${payload.cdt_code} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function updateFee(id: string, fee: number) {
    try {
      const row = await updateTreatmentFee(id, fee);
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, ...row } : item)),
      );
      toast.success("Fee updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fee save failed");
    }
  }

  async function movePhase(id: string, phase: TreatmentItem["phase"]) {
    try {
      const row = await updateTreatmentPhase(id, phase);
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, ...row } : item)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Move failed");
    }
  }

  return {
    rows,
    items,
    visible,
    pending,
    expandedId,
    setExpandedId,
    query,
    setQuery,
    severityFilter,
    setSeverityFilter,
    editorId,
    editorSeed,
    editorSurface,
    openEditor,
    closeEditor,
    editing,
    bookId,
    bookMode,
    openBook,
    setBookId,
    booking,
    deleteId,
    setDeleteId,
    saveTreatment,
    createTreatmentFromDraft,
    removeAttachment,
    confirmDelete,
    afterBooked,
    addCdtProcedure,
    updateFee,
    movePhase,
  };
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  buildClinicalNote,
  type ClinicalNote,
  type ClinicalNoteCategory,
  type NoteTarget,
} from "@/services/clinical_notes";
import {
  createPatientClinicalNote,
  listPatientClinicalNotes,
} from "@/services/clinical_notes/mutations";
import { ADMIN_OPEN_CLINICAL_NOTE_EVENT } from "@/features/admin/lib/adminShellEvents";

function rowToNote(row: {
  id: string;
  target_id: string;
  category: ClinicalNote["category"];
  content: string;
  created_at: string;
  author: string;
}): ClinicalNote {
  return {
    id: row.id,
    targetId: row.target_id,
    category: row.category,
    content: row.content,
    createdAt: row.created_at,
    author: row.author,
  };
}

export function useClinicalNotes(patientKey?: string) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [openTarget, setOpenTarget] = useState<NoteTarget | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      if (!patientKey) {
        if (alive) setNotes([]);
        return;
      }
      try {
        const rows = await listPatientClinicalNotes(patientKey);
        if (alive) setNotes(rows.map(rowToNote));
      } catch {
        /* table may not exist yet locally */
      }
    })();
    return () => {
      alive = false;
    };
  }, [patientKey]);

  useEffect(() => {
    if (!patientKey) return;
    function onOpenNote() {
      setOpenTarget({ id: "visit", label: "Visit" });
    }
    window.addEventListener(ADMIN_OPEN_CLINICAL_NOTE_EVENT, onOpenNote);
    return () =>
      window.removeEventListener(ADMIN_OPEN_CLINICAL_NOTE_EVENT, onOpenNote);
  }, [patientKey]);

  async function onSave(note: ClinicalNote) {
    if (!patientKey) {
      setNotes((prev) => [note, ...prev]);
      setOpenTarget(null);
      return;
    }
    try {
      const targetKind =
        note.targetId === "visit"
          ? "visit"
          : /^[1-8][1-8]$/.test(note.targetId)
            ? "tooth"
            : "treatment";
      const row = await createPatientClinicalNote({
        patient_key: patientKey,
        category: note.category,
        content: note.content,
        target_kind: targetKind,
        target_id: note.targetId,
        tooth_fdi: targetKind === "tooth" ? note.targetId : null,
        treatment_id: targetKind === "treatment" ? note.targetId : null,
        author: note.author,
      });
      setNotes((prev) => [rowToNote(row), ...prev]);
      setOpenTarget(null);
      toast.success("Clinical note saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save note");
    }
  }

  return {
    notes,
    openTarget,
    onOpen: setOpenTarget,
    onClose: () => setOpenTarget(null),
    onSave,
    openVisitNote: () => setOpenTarget({ id: "visit", label: "Visit" }),
    openProcedureNote: (id: string, label: string) =>
      setOpenTarget({ id, label }),
    openToothNote: (fdi: string, label: string) =>
      setOpenTarget({ id: fdi, label: `Tooth #${label}` }),
  };
}

export function createDraftNote(
  targetId: string,
  category: ClinicalNoteCategory,
  content: string,
): ClinicalNote {
  return buildClinicalNote({ targetId, category, content });
}

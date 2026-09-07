"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createToothNote,
  deleteToothNote,
  deleteToothNoteAttachment,
  notesForFdi,
  teethWithNotes,
  toothNoteBodySchema,
  toothNoteUpdateSchema,
  updateToothNote,
  uploadToothNoteFile,
  type PatientToothNote,
} from "@/services/patient_tooth_notes";

function clearEditState() {
  return { editingNoteId: null as string | null, editBody: "", editPendingFiles: [] as File[] };
}

export function usePatientToothNotes(
  patientKey: string,
  initial: PatientToothNote[],
  initialSelectedFdi: string | null = null,
) {
  const [notes, setNotes] = useState(initial);
  const [selectedFdi, setSelectedFdi] = useState<string | null>(
    initialSelectedFdi,
  );
  const [draftBody, setDraftBody] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editPendingFiles, setEditPendingFiles] = useState<File[]>([]);

  const commented = useMemo(() => teethWithNotes(notes), [notes]);
  const selectedNotes = useMemo(
    () => (selectedFdi ? notesForFdi(notes, selectedFdi) : []),
    [notes, selectedFdi],
  );

  function resetEdit() {
    const cleared = clearEditState();
    setEditingNoteId(cleared.editingNoteId);
    setEditBody(cleared.editBody);
    setEditPendingFiles(cleared.editPendingFiles);
  }

  function selectTooth(fdi: string) {
    setSelectedFdi(fdi);
    setDraftBody("");
    setPendingFiles([]);
    resetEdit();
  }

  function deselectTooth() {
    setSelectedFdi(null);
    setDraftBody("");
    setPendingFiles([]);
    resetEdit();
  }

  function startEdit(note: PatientToothNote) {
    setEditingNoteId(note.id);
    setEditBody(note.body);
    setEditPendingFiles([]);
  }

  function replaceNote(updated: PatientToothNote) {
    setNotes((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...updated,
              patient_tooth_note_attachments:
                updated.patient_tooth_note_attachments ?? [],
            }
          : row,
      ),
    );
  }

  async function saveNote() {
    if (!selectedFdi) return;
    const parsed = toothNoteBodySchema.safeParse({
      fdi_number: selectedFdi,
      body: draftBody,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setPending(true);
    try {
      const uploads = await Promise.all(
        pendingFiles.map((file) =>
          uploadToothNoteFile(patientKey, selectedFdi, file),
        ),
      );
      const row = await createToothNote(
        patientKey,
        parsed.data.fdi_number,
        parsed.data.body,
        uploads,
      );
      setNotes((prev) => [
        { ...row, patient_tooth_note_attachments: row.patient_tooth_note_attachments ?? [] },
        ...prev,
      ]);
      setDraftBody("");
      setPendingFiles([]);
      toast.success("Note added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function saveObjectiveNote(body: string) {
    if (!selectedFdi) return;
    const parsed = toothNoteBodySchema.safeParse({
      fdi_number: selectedFdi,
      body,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setPending(true);
    try {
      const row = await createToothNote(
        patientKey,
        parsed.data.fdi_number,
        parsed.data.body,
      );
      setNotes((prev) => [
        { ...row, patient_tooth_note_attachments: row.patient_tooth_note_attachments ?? [] },
        ...prev,
      ]);
      toast.success("Saved to SOAP");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function saveEdit() {
    if (!editingNoteId || !selectedFdi) return;
    const parsed = toothNoteUpdateSchema.safeParse({ body: editBody });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid note");
      return;
    }
    setPending(true);
    try {
      const uploads = await Promise.all(
        editPendingFiles.map((file) =>
          uploadToothNoteFile(patientKey, selectedFdi, file),
        ),
      );
      const row = await updateToothNote(editingNoteId, parsed.data.body, uploads);
      replaceNote(row);
      resetEdit();
      toast.success("Note updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function removeAttachment(noteId: string, attachmentId: string) {
    setPending(true);
    try {
      await deleteToothNoteAttachment(attachmentId);
      setNotes((prev) =>
        prev.map((row) =>
          row.id === noteId
            ? {
                ...row,
                patient_tooth_note_attachments:
                  row.patient_tooth_note_attachments.filter(
                    (file) => file.id !== attachmentId,
                  ),
              }
            : row,
        ),
      );
      toast.success("Attachment removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmDeleteNote() {
    if (!deleteNoteId) return;
    setPending(true);
    try {
      await deleteToothNote(deleteNoteId);
      setNotes((prev) => prev.filter((row) => row.id !== deleteNoteId));
      if (editingNoteId === deleteNoteId) resetEdit();
      setDeleteNoteId(null);
      toast.success("Note removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  return {
    notes,
    selectedFdi,
    selectedNotes,
    draftBody,
    setDraftBody,
    pendingFiles,
    editingNoteId,
    editBody,
    setEditBody,
    editPendingFiles,
    addPendingFiles: (files: FileList | File[]) =>
      setPendingFiles((prev) => [...prev, ...Array.from(files)]),
    removePendingFile: (index: number) =>
      setPendingFiles((prev) => prev.filter((_, i) => i !== index)),
    addEditPendingFiles: (files: FileList | File[]) =>
      setEditPendingFiles((prev) => [...prev, ...Array.from(files)]),
    removeEditPendingFile: (index: number) =>
      setEditPendingFiles((prev) => prev.filter((_, i) => i !== index)),
    pending,
    commented,
    selectTooth,
    deselectTooth,
    startEdit,
    cancelEdit: resetEdit,
    saveNote,
    saveObjectiveNote,
    saveEdit,
    removeAttachment,
    deleteNoteId,
    setDeleteNoteId,
    confirmDeleteNote,
  };
}

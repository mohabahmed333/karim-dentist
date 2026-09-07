"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { toothName } from "@/services/patient_tooth_findings/fdi";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { ToothNoteCard } from "./ToothNoteCard";
import { ToothNoteComposer } from "./ToothNoteComposer";

type Props = {
  selectedFdi: string | null;
  notes: PatientToothNote[];
  draftBody: string;
  pendingFiles: File[];
  editingNoteId: string | null;
  editBody: string;
  editPendingFiles: File[];
  pending: boolean;
  onClose: () => void;
  onDraftChange: (value: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onSave: () => void | Promise<void>;
  onStartEdit: (note: PatientToothNote) => void;
  onCancelEdit: () => void;
  onEditBodyChange: (value: string) => void;
  onAddEditFiles: (files: FileList | File[]) => void;
  onRemoveEditPendingFile: (index: number) => void;
  onRemoveAttachment: (noteId: string, attachmentId: string) => void;
  onSaveEdit: () => void;
  onDeleteNote: (noteId: string) => void;
  compact?: boolean;
};

export function ToothRecordPanel({
  selectedFdi,
  notes,
  draftBody,
  pendingFiles,
  editingNoteId,
  editBody,
  editPendingFiles,
  pending,
  onClose,
  onDraftChange,
  onAddFiles,
  onRemovePendingFile,
  onSave,
  onStartEdit,
  onCancelEdit,
  onEditBodyChange,
  onAddEditFiles,
  onRemoveEditPendingFile,
  onRemoveAttachment,
  onSaveEdit,
  onDeleteNote,
  compact = false,
}: Props) {
  const sortedNotes = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [notes],
  );

  if (!selectedFdi) {
    return (
      <div
        className={`flex items-center justify-center bg-[#fafafa] p-8 ${
          compact ? "min-h-[12rem]" : "min-h-[420px]"
        }`}
      >
        <p className="max-w-xs text-center text-sm leading-relaxed text-[#94a3b8]">
          Select a tooth on the chart to view clinical notes.
        </p>
      </div>
    );
  }

  return (
    <aside
      className={`flex flex-col overflow-hidden bg-[#fafafa] ${
        compact
          ? "min-h-0 max-h-none"
          : "max-h-[560px] min-h-[420px]"
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-3 ${
          compact ? "px-1 py-2" : "px-6 py-5"
        }`}
      >
        <div>
          <h3
            className={`font-semibold tracking-tight text-[#1e293b] ${
              compact ? "text-[14px]" : "text-[17px]"
            }`}
          >
            Clinical Notes
          </h3>
          <p className="mt-1 text-xs text-[#94a3b8]">
            Tooth {selectedFdi} · {toothName(selectedFdi)}
          </p>
        </div>
        {!compact ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#475569]"
            aria-label="Close clinical notes"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div
        className={`flex-1 overflow-y-auto ${compact ? "px-1" : "px-6"}`}
      >
        {sortedNotes.length === 0 ? (
          <p className="py-10 text-sm leading-relaxed text-[#94a3b8]">
            No clinical notes for this tooth yet.
          </p>
        ) : (
          <ul className="divide-y-0">
            {sortedNotes.map((note) => (
              <ToothNoteCard
                key={note.id}
                note={note}
                pending={pending}
                editing={editingNoteId === note.id}
                editBody={editBody}
                editPendingFiles={editPendingFiles}
                onStartEdit={() => onStartEdit(note)}
                onCancelEdit={onCancelEdit}
                onEditBodyChange={onEditBodyChange}
                onAddEditFiles={onAddEditFiles}
                onRemoveEditPendingFile={onRemoveEditPendingFile}
                onRemoveAttachment={(id) => onRemoveAttachment(note.id, id)}
                onSaveEdit={onSaveEdit}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <ToothRecordComposerSection
        key={selectedFdi}
        draftBody={draftBody}
        pendingFiles={pendingFiles}
        pending={pending}
        onDraftChange={onDraftChange}
        onAddFiles={onAddFiles}
        onRemovePendingFile={onRemovePendingFile}
        onSave={onSave}
      />
    </aside>
  );
}

type ComposerSectionProps = Pick<
  Props,
  | "draftBody"
  | "pendingFiles"
  | "pending"
  | "onDraftChange"
  | "onAddFiles"
  | "onRemovePendingFile"
  | "onSave"
>;

function ToothRecordComposerSection({
  draftBody,
  pendingFiles,
  pending,
  onDraftChange,
  onAddFiles,
  onRemovePendingFile,
  onSave,
}: ComposerSectionProps) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <ToothNoteComposer
      draftBody={draftBody}
      pendingFiles={pendingFiles}
      pending={pending}
      expanded={composerOpen}
      onToggle={() => setComposerOpen((open) => !open)}
      onDraftChange={onDraftChange}
      onAddFiles={onAddFiles}
      onRemovePendingFile={onRemovePendingFile}
      onSave={async () => {
        await onSave();
        setComposerOpen(false);
      }}
    />
  );
}

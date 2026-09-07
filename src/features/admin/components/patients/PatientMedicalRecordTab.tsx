"use client";

import { useState } from "react";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { Odontogram } from "./Odontogram";
import { ServiceToggle, type ServiceFilter } from "./ServiceToggle";
import { ToothRecordPanel } from "./ToothRecordPanel";

type Props = {
  selectedFdi: string | null;
  commented: ReadonlySet<string>;
  selectedNotes: PatientToothNote[];
  draftBody: string;
  pendingFiles: File[];
  editingNoteId: string | null;
  editBody: string;
  editPendingFiles: File[];
  pending: boolean;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onDraftChange: (value: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onSave: () => void;
  onStartEdit: (note: PatientToothNote) => void;
  onCancelEdit: () => void;
  onEditBodyChange: (value: string) => void;
  onAddEditFiles: (files: FileList | File[]) => void;
  onRemoveEditPendingFile: (index: number) => void;
  onRemoveAttachment: (noteId: string, attachmentId: string) => void;
  onSaveEdit: () => void;
  onDeleteNote: (noteId: string) => void;
};

export function PatientMedicalRecordTab(props: Props) {
  const [hoveredFdi, setHoveredFdi] = useState<string | null>(null);
  const [service, setService] = useState<ServiceFilter>("medical");

  return (
    <div className="space-y-5 pt-6">
      <ServiceToggle value={service} onChange={setService} />

      {service === "cosmetic" ? (
        <p className="rounded-2xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-8 text-center text-sm text-[#9ca3af]">
          Cosmetic service notes are not available yet.
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Odontogram
            selectedFdi={props.selectedFdi}
            hoveredFdi={hoveredFdi}
            commented={props.commented}
            onSelect={props.onSelect}
            onHover={setHoveredFdi}
            onDeselect={props.onDeselect}
          />
          <ToothRecordPanel
            {...props}
            notes={props.selectedNotes}
            onClose={props.onDeselect}
          />
        </div>
      )}
    </div>
  );
}

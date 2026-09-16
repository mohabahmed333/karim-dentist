"use client";

import { useState } from "react";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { Odontogram } from "./Odontogram";
import { TOOTH_CHART_HEIGHT } from "./teeth-charts/TeethChartCanvas";
import { cn } from "@/lib/utils";
import { ToothRecordPanel } from "./ToothRecordPanel";
import { ToothTreatmentTimeline } from "./ToothTreatmentTimeline";
import type { TreatmentItem } from "@/services/patient_treatments";

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
  /** Every treatment on the patient; the timeline narrows to the shown tooth. */
  treatments: TreatmentItem[];
  doctorNameById: Record<string, string>;
};

export function PatientMedicalRecordTab(props: Props) {
  const [hoveredFdi, setHoveredFdi] = useState<string | null>(null);

  return (
    <div className="grid items-start gap-5 pt-6 lg:grid-cols-2">
      {/* The chart stays put while the record beside it scrolls — it is the
          thing you keep referring back to, and a fixed height stops it
          resizing as teeth gain and lose notes. */}
      <div className={cn("lg:sticky lg:top-4", TOOTH_CHART_HEIGHT)}>
        <Odontogram
          fill
          selectedFdi={props.selectedFdi}
          hoveredFdi={hoveredFdi}
          commented={props.commented}
          onSelect={props.onSelect}
          onHover={setHoveredFdi}
          onDeselect={props.onDeselect}
        />
      </div>
      {/* Timeline first — it is what the record is for. The note composer
          stays below it so writing a note is still possible without leaving
          for the clinical workspace. */}
      <div className="min-w-0 space-y-5">
        <ToothTreatmentTimeline
          selectedFdi={props.selectedFdi}
          treatments={props.treatments}
          doctorNameById={props.doctorNameById}
        />
        <ToothRecordPanel
          {...props}
          notes={props.selectedNotes}
          onClose={props.onDeselect}
        />
      </div>
    </div>
  );
}

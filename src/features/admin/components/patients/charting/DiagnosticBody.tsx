"use client";

import type { PatientImaging } from "@/services/patient_imaging";
import { ToothRecordPanel } from "../ToothRecordPanel";
import type { usePatientToothNotes } from "../usePatientToothNotes";
import type { DiagTab } from "./useChartingSession";
import { ImagingLightbox } from "./ImagingLightbox";
import { PerioStrip } from "./PerioStrip";
import { VitalityCard } from "./VitalityCard";

type Props = {
  tab: DiagTab;
  selectedFdi: string | null;
  patientKey: string;
  imaging: PatientImaging[];
  onUploaded: (row: PatientImaging) => void;
  notesChart: ReturnType<typeof usePatientToothNotes>;
};

export function DiagnosticBody({
  tab,
  selectedFdi,
  patientKey,
  imaging,
  onUploaded,
  notesChart,
}: Props) {
  if (!selectedFdi) return null;
  if (tab === "imaging") {
    return (
      <ImagingLightbox
        patientKey={patientKey}
        fdi={selectedFdi}
        items={imaging}
        onUploaded={onUploaded}
      />
    );
  }
  if (tab === "vitality") {
    return (
      <VitalityCard
        pending={notesChart.pending}
        onSave={notesChart.saveObjectiveNote}
      />
    );
  }
  if (tab === "perio") {
    return (
      <PerioStrip
        pending={notesChart.pending}
        onSave={notesChart.saveObjectiveNote}
      />
    );
  }
  return (
    <ToothRecordPanel
      selectedFdi={selectedFdi}
      notes={notesChart.selectedNotes}
      draftBody={notesChart.draftBody}
      pendingFiles={notesChart.pendingFiles}
      editingNoteId={notesChart.editingNoteId}
      editBody={notesChart.editBody}
      editPendingFiles={notesChart.editPendingFiles}
      pending={notesChart.pending}
      onClose={notesChart.deselectTooth}
      onDraftChange={notesChart.setDraftBody}
      onAddFiles={notesChart.addPendingFiles}
      onRemovePendingFile={notesChart.removePendingFile}
      onSave={notesChart.saveNote}
      onStartEdit={notesChart.startEdit}
      onCancelEdit={notesChart.cancelEdit}
      onEditBodyChange={notesChart.setEditBody}
      onAddEditFiles={notesChart.addEditPendingFiles}
      onRemoveEditPendingFile={notesChart.removeEditPendingFile}
      onRemoveAttachment={notesChart.removeAttachment}
      onSaveEdit={notesChart.saveEdit}
      onDeleteNote={notesChart.setDeleteNoteId}
    />
  );
}

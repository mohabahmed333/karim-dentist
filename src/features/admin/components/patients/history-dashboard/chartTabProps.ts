import type { ComponentProps } from "react";
import type { PatientMedicalRecordTab } from "../PatientMedicalRecordTab";
import type { usePatientToothNotes } from "../usePatientToothNotes";

type Chart = ReturnType<typeof usePatientToothNotes>;

export function chartTabProps(
  chart: Chart,
): ComponentProps<typeof PatientMedicalRecordTab> {
  return {
    selectedFdi: chart.selectedFdi,
    commented: chart.commented,
    selectedNotes: chart.selectedNotes,
    draftBody: chart.draftBody,
    pendingFiles: chart.pendingFiles,
    editingNoteId: chart.editingNoteId,
    editBody: chart.editBody,
    editPendingFiles: chart.editPendingFiles,
    pending: chart.pending,
    onSelect: chart.selectTooth,
    onDeselect: chart.deselectTooth,
    onDraftChange: chart.setDraftBody,
    onAddFiles: chart.addPendingFiles,
    onRemovePendingFile: chart.removePendingFile,
    onSave: chart.saveNote,
    onStartEdit: chart.startEdit,
    onCancelEdit: chart.cancelEdit,
    onEditBodyChange: chart.setEditBody,
    onAddEditFiles: chart.addEditPendingFiles,
    onRemoveEditPendingFile: chart.removeEditPendingFile,
    onRemoveAttachment: chart.removeAttachment,
    onSaveEdit: chart.saveEdit,
    onDeleteNote: chart.setDeleteNoteId,
  };
}

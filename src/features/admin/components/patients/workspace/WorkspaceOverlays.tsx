"use client";

import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import { ClinicalNoteModal } from "../charting/ClinicalNoteModal";
import { TreatmentBookDrawer } from "../treatments/TreatmentBookDrawer";
import { TreatmentEditorDrawer } from "../treatments/TreatmentEditorDrawer";
import type { usePatientWorkspace } from "./usePatientWorkspace";

type Props = {
  group: PatientGroup;
  services: Service[];
  w: ReturnType<typeof usePatientWorkspace>;
};

export function WorkspaceOverlays({ group, services, w }: Props) {
  const chart = w.treatmentsChart;

  return (
    <>
      <TreatmentBookDrawer
        open={Boolean(chart.booking)}
        mode={chart.bookMode}
        group={group}
        services={services}
        treatment={chart.booking}
        onClose={() => chart.setBookId(null)}
        onBooked={chart.afterBooked}
      />
      <TreatmentEditorDrawer
        open={chart.editorId !== null && chart.editorSurface === "drawer"}
        isNew={chart.editorId === "new"}
        editing={chart.editing}
        seed={chart.editorSeed}
        pending={chart.pending}
        onClose={chart.closeEditor}
        onSave={(raw, files) => void chart.saveTreatment(raw, files)}
        onRemoveSavedAttachment={(id) => void chart.removeAttachment(id)}
      />
      <ClinicalNoteModal
        target={w.clinicalNotes.openTarget}
        onClose={w.clinicalNotes.onClose}
        onSave={w.clinicalNotes.onSave}
      />
      <ConfirmDeleteDialog
        open={Boolean(chart.deleteId)}
        onOpenChange={(open) => {
          if (!open) chart.setDeleteId(null);
        }}
        pending={chart.pending}
        title="Remove this treatment?"
        description="This deletes the required treatment record."
        onConfirm={chart.confirmDelete}
      />
      <ConfirmDeleteDialog
        open={Boolean(w.notesChart.deleteNoteId)}
        onOpenChange={(open) => {
          if (!open) w.notesChart.setDeleteNoteId(null);
        }}
        pending={w.notesChart.pending}
        title="Remove this note?"
        description="This deletes the note and its attachments from this tooth."
        onConfirm={w.notesChart.confirmDeleteNote}
      />
    </>
  );
}

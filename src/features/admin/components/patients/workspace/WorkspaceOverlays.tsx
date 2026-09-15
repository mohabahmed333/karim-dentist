"use client";

import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { ConsumablesCheckoutDialog } from "@/features/admin/components/inventory/ConsumablesCheckoutDialog";
import { useTranslations } from "@/lib/i18n";
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
  const t = useTranslations();
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
      <ConsumablesCheckoutDialog {...chart.checkoutDialog} />
      <ConfirmDeleteDialog
        open={Boolean(chart.deleteId)}
        onOpenChange={(open) => {
          if (!open) chart.setDeleteId(null);
        }}
        pending={chart.pending}
        title={t("admin.patients.deleteTreatmentTitle")}
        description={t("admin.patients.deleteTreatmentDesc")}
        onConfirm={chart.confirmDelete}
      />
      <ConfirmDeleteDialog
        open={Boolean(w.notesChart.deleteNoteId)}
        onOpenChange={(open) => {
          if (!open) w.notesChart.setDeleteNoteId(null);
        }}
        pending={w.notesChart.pending}
        title={t("admin.patients.deleteNoteTitle")}
        description={t("admin.patients.deleteNoteDesc")}
        onConfirm={w.notesChart.confirmDeleteNote}
      />
    </>
  );
}

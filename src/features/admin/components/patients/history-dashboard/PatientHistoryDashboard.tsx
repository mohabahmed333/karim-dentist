"use client";

import { useState } from "react";
import { ClinicalCanvasLtr } from "@/features/admin/components/ClinicalCanvasLtr";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import type { Service } from "@/services/services/types";
import { ClinicalNoteModal } from "../charting/ClinicalNoteModal";
import { PatientChartingWorkspace } from "../charting/PatientChartingWorkspace";
import { useClinicalNotes } from "../charting/useClinicalNotes";
import { PATIENT_SHELL } from "../patientSkin";
import { usePatientImaging } from "../usePatientImaging";
import { usePatientToothNotes } from "../usePatientToothNotes";
import { usePatientTreatments } from "../usePatientTreatments";
import { DashboardHeader } from "./DashboardHeader";
import { PatientViewTabs } from "./PatientViewTabs";
import { RecordsOverlay } from "./RecordsOverlay";
import { RecordsPaneBody } from "./RecordsPaneBody";
import {
  paneFromView,
  viewFromPane,
  type RecordsPane,
} from "./recordsPane";
import "./history-dashboard.css";

type Props = {
  group: PatientGroup;
  notes: PatientToothNote[];
  imaging: PatientImaging[];
  treatments: PatientTreatmentRow[];
  services: Service[];
  directory: PatientGroup[];
};

export function PatientHistoryDashboard({
  group,
  notes,
  imaging,
  treatments,
  services,
  directory,
}: Props) {
  const [records, setRecords] = useState<RecordsPane | null>(null);
  const clinicalNotes = useClinicalNotes(group.patientKey);
  const notesChart = usePatientToothNotes(group.patientKey, notes);
  const imagingChart = usePatientImaging(group.patientKey, imaging);
  const treatmentsChart = usePatientTreatments(
    group.patientKey,
    treatments,
    (rows) => imagingChart.prepend(rows),
  );

  return (
    <div
      className={`relative -m-4 flex min-h-[calc(100dvh-4.5rem)] flex-col overflow-x-clip ${PATIENT_SHELL} px-4 py-4 pb-24 md:-m-6 md:px-6 md:py-5 md:pb-24`}
    >
      <DashboardHeader
        group={group}
        directory={directory}
        onAddNote={clinicalNotes.openVisitNote}
      />
      <ClinicalCanvasLtr className="min-h-0 flex-1">
        <PatientChartingWorkspace
          group={group}
          services={services}
          notesChart={notesChart}
          imagingChart={imagingChart}
          treatmentsChart={treatmentsChart}
          onAddNote={clinicalNotes.openProcedureNote}
        />
      </ClinicalCanvasLtr>
      <RecordsOverlay pane={records}>
        {records ? (
          <RecordsPaneBody
            pane={records}
            group={group}
            services={services}
            notesChart={notesChart}
            imagingChart={imagingChart}
            treatmentsChart={treatmentsChart}
          />
        ) : null}
      </RecordsOverlay>
      <PatientViewTabs
        active={viewFromPane(records)}
        onChange={(view) => setRecords(paneFromView(view))}
      />
      <ConfirmDeleteDialog
        open={Boolean(imagingChart.deleteId)}
        onOpenChange={(open) => {
          if (!open) imagingChart.setDeleteId(null);
        }}
        pending={imagingChart.pending}
        title="Remove this X-ray?"
        description="This deletes the imaging record. The file may remain in storage."
        onConfirm={imagingChart.confirmDelete}
      />
      <ConfirmDeleteDialog
        open={Boolean(notesChart.deleteNoteId)}
        onOpenChange={(open) => {
          if (!open) notesChart.setDeleteNoteId(null);
        }}
        pending={notesChart.pending}
        title="Remove this note?"
        description="This deletes the note and its attachments from this tooth."
        onConfirm={notesChart.confirmDeleteNote}
      />
      <ClinicalNoteModal
        target={clinicalNotes.openTarget}
        onClose={clinicalNotes.onClose}
        onSave={clinicalNotes.onSave}
      />
    </div>
  );
}

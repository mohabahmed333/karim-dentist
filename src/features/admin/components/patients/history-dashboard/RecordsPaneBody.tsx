"use client";

import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import { PatientEhrView } from "../ehr-view/PatientEhrView";
import { PatientHistoryView } from "../PatientHistoryView";
import { PatientTeethPane } from "../PatientTeethPane";
import type { usePatientImaging } from "../usePatientImaging";
import type { usePatientToothNotes } from "../usePatientToothNotes";
import type { usePatientTreatments } from "../usePatientTreatments";
import { chartTabProps } from "./chartTabProps";
import type { RecordsPane } from "./recordsPane";

type Props = {
  pane: RecordsPane;
  group: PatientGroup;
  services: Service[];
  notesChart: ReturnType<typeof usePatientToothNotes>;
  imagingChart: ReturnType<typeof usePatientImaging>;
  treatmentsChart: ReturnType<typeof usePatientTreatments>;
};

export function RecordsPaneBody({
  pane,
  group,
  services,
  notesChart,
  imagingChart,
  treatmentsChart,
}: Props) {
  if (pane === "history") {
    return (
      <PatientHistoryView
        group={group}
        treatments={treatmentsChart.items}
        embedded
      />
    );
  }
  if (pane === "clinical") {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <PatientEhrView
          group={group}
          treatments={treatmentsChart.items}
          imaging={imagingChart.items}
          notes={notesChart.notes}
        />
      </div>
    );
  }
  return (
    <PatientTeethPane
      {...chartTabProps(notesChart)}
      group={group}
      treatmentsChart={treatmentsChart}
      services={services}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments";
import { chartInspectorTitle, fdiSet } from "@/services/notation";
import { usePatientImaging } from "../usePatientImaging";
import { usePatientToothNotes } from "../usePatientToothNotes";
import { usePatientTreatments } from "../usePatientTreatments";
import { useChartingSession } from "../charting/useChartingSession";
import { useClinicalNotes } from "../charting/useClinicalNotes";
import { useToothSurfaces } from "../charting/useToothSurfaces";
import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import { useToothSearchParam } from "./useToothSearchParam";

export function usePatientWorkspace(
  group: PatientGroup,
  notes: PatientToothNote[],
  imaging: PatientImaging[],
  treatments: PatientTreatmentRow[],
) {
  const clinicalNotes = useClinicalNotes(group.patientKey);
  const session = useChartingSession(group.patientKey);
  const { toothFromUrl, setToothInUrl } = useToothSearchParam();
  const urlTooth =
    toothFromUrl && fdiSet(session.dentition).includes(toothFromUrl)
      ? toothFromUrl
      : null;

  const notesChart = usePatientToothNotes(
    group.patientKey,
    notes,
    urlTooth,
  );
  const imagingChart = usePatientImaging(group.patientKey, imaging);
  const treatmentsChart = usePatientTreatments(
    group.patientKey,
    treatments,
    (rows) => imagingChart.prepend(rows),
  );
  const surfaces = useToothSurfaces(group.patientKey, session.dentition);
  const [chartStyle, setChartStyle] = useState<TeethChartStyle>("anatomic");

  useEffect(() => {
    if (urlTooth) {
      if (notesChart.selectedFdi !== urlTooth) notesChart.selectTooth(urlTooth);
      return;
    }
    if (notesChart.selectedFdi) notesChart.deselectTooth();
    // Hydrate / clear from URL only — do not depend on selectedFdi (avoids race with replace).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTooth]);

  function selectTooth(fdi: string) {
    notesChart.selectTooth(fdi);
    setToothInUrl(fdi);
  }

  function deselectTooth() {
    notesChart.deselectTooth();
    setToothInUrl(null);
  }

  const selected = notesChart.selectedFdi;
  const selectedFdi =
    selected && fdiSet(session.dentition).includes(selected) ? selected : null;

  return {
    clinicalNotes,
    notesChart,
    imagingChart,
    treatmentsChart,
    session,
    surfaces,
    chartStyle,
    setChartStyle,
    selected,
    selectedFdi,
    selectTooth,
    deselectTooth,
    toothLabel: selectedFdi
      ? chartInspectorTitle(selectedFdi, session.notation)
      : "Tooth",
  };
}

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
  forcedToothFdi: string | null = null,
) {
  const clinicalNotes = useClinicalNotes(group.patientKey);
  const session = useChartingSession(group.patientKey);
  const { toothFromUrl, setToothInUrl } = useToothSearchParam();
  const urlTooth =
    toothFromUrl && fdiSet(session.dentition).includes(toothFromUrl)
      ? toothFromUrl
      : null;
  const seedTooth =
    forcedToothFdi && fdiSet(session.dentition).includes(forcedToothFdi)
      ? forcedToothFdi
      : urlTooth;

  const notesChart = usePatientToothNotes(
    group.patientKey,
    notes,
    seedTooth,
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
    if (forcedToothFdi) {
      if (notesChart.selectedFdi !== forcedToothFdi) {
        notesChart.selectTooth(forcedToothFdi);
      }
      return;
    }
    if (urlTooth) {
      if (notesChart.selectedFdi !== urlTooth) notesChart.selectTooth(urlTooth);
      return;
    }
    if (notesChart.selectedFdi) notesChart.deselectTooth();
    // Hydrate / clear from URL / forced tooth only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTooth, forcedToothFdi]);

  function selectTooth(fdi: string) {
    notesChart.selectTooth(fdi);
    if (!forcedToothFdi) setToothInUrl(fdi);
  }

  function deselectTooth() {
    notesChart.deselectTooth();
    if (!forcedToothFdi) setToothInUrl(null);
  }

  useEffect(() => {
    function onClinical(event: Event) {
      const detail = (
        event as CustomEvent<{ type?: string; fdi?: string }>
      ).detail;
      if (detail?.type !== "select-tooth" || !detail.fdi) return;
      if (!fdiSet(session.dentition).includes(detail.fdi)) return;
      notesChart.selectTooth(detail.fdi);
    }
    window.addEventListener("showreel-clinical", onClinical);
    return () => window.removeEventListener("showreel-clinical", onClinical);
  }, [notesChart, session.dentition]);

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

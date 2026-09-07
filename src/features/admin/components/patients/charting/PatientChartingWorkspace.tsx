"use client";

import { chartInspectorTitle, fdiSet } from "@/services/notation";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Service } from "@/services/services/types";
import type { usePatientImaging } from "../usePatientImaging";
import type { usePatientToothNotes } from "../usePatientToothNotes";
import type { usePatientTreatments } from "../usePatientTreatments";
import { emptySurfaces } from "@/services/tooth_surfaces";
import { CHART_CANVAS } from "./chartingSkin";
import { ChairsideChartChrome } from "./ChairsideChartChrome";
import { ChairsideDrawersHost } from "./ChairsideDrawersHost";
import { ChairsidePanelsHost } from "./ChairsidePanelsHost";
import { ChartingOverlays } from "./ChartingOverlays";
import { useChairsideInspect } from "./useChairsideInspect";
import { useChartingSession } from "./useChartingSession";
import { useChartingTour } from "./useChartingTour";
import { useToothSurfaces } from "./useToothSurfaces";

type Props = {
  group: PatientGroup;
  services: Service[];
  notesChart: ReturnType<typeof usePatientToothNotes>;
  imagingChart: ReturnType<typeof usePatientImaging>;
  treatmentsChart: ReturnType<typeof usePatientTreatments>;
  onAddNote: (procedureId: string, label: string) => void;
};

export function PatientChartingWorkspace({
  group,
  services,
  notesChart,
  imagingChart,
  treatmentsChart,
  onAddNote,
}: Props) {
  const session = useChartingSession(group.patientKey);
  const tour = useChartingTour();
  const surfaces = useToothSurfaces(group.patientKey, session.dentition);
  const inspect = useChairsideInspect();
  const selected = notesChart.selectedFdi;
  const selectedFdi =
    selected && fdiSet(session.dentition).includes(selected) ? selected : null;
  const label = selectedFdi
    ? chartInspectorTitle(selectedFdi, session.notation)
    : "";

  function selectTooth(fdi: string) {
    notesChart.selectTooth(fdi);
    inspect.openInspector();
  }

  function deselectTooth() {
    notesChart.deselectTooth();
    inspect.closeInspector();
  }

  return (
    <div className={`mt-5 ${CHART_CANVAS}`}>
      <ChairsideChartChrome
        hasTooth={Boolean(selectedFdi)}
        onInspect={inspect.openInspector}
        onReplayTour={tour.replay}
      />
      <ChairsidePanelsHost
        ring={tour.ring}
        notation={session.notation}
        onNotation={session.setNotation}
        dentition={session.dentition}
        onDentition={(value) => {
          session.setDentition(value);
          if (selected && !fdiSet(value).includes(selected)) deselectTooth();
        }}
        paintTool={session.paintTool}
        onPaintTool={session.setPaintTool}
        selectedFdi={selectedFdi}
        byFdi={surfaces.byFdi}
        onSelect={selectTooth}
        onDeselect={deselectTooth}
        onPaint={(fdi, surface) => {
          selectTooth(fdi);
          void surfaces.paint(fdi, surface, session.paintTool);
        }}
        items={treatmentsChart.items}
        onAdd={(code, fee) => {
          if (selectedFdi) {
            void treatmentsChart.addCdtProcedure(selectedFdi, code, fee);
          }
        }}
        onPhase={(id, phase) => void treatmentsChart.movePhase(id, phase)}
        onDelete={(id) => treatmentsChart.setDeleteId(id)}
        onBookRow={(id, mode) => treatmentsChart.openBook(id, mode)}
        onBookSelected={() => {
          const row = treatmentsChart.items.find(
            (item) => item.toothFdi === selectedFdi && item.status === "open",
          );
          if (row) treatmentsChart.openBook(row.id, "book");
        }}
        onAddNote={onAddNote}
      />
      <ChairsideDrawersHost
        inspectorOpen={inspect.inspectorOpen}
        onCloseInspector={inspect.closeInspector}
        builderOpen={inspect.builderOpen}
        onCloseBuilder={inspect.closeBuilder}
        selectedFdi={selectedFdi}
        toothLabel={label}
        diagTab={session.diagTab}
        onDiagTab={session.setDiagTab}
        patientKey={group.patientKey}
        notation={session.notation}
        paintTool={session.paintTool}
        surfaces={
          selectedFdi
            ? (surfaces.byFdi.get(selectedFdi) ?? emptySurfaces())
            : emptySurfaces()
        }
        onPaint={(fdi, surface) => {
          void surfaces.paint(fdi, surface, session.paintTool);
        }}
        notesChart={notesChart}
        imagingChart={imagingChart}
        treatmentsChart={treatmentsChart}
      />
      <ChartingOverlays
        tour={tour}
        group={group}
        services={services}
        treatmentsChart={treatmentsChart}
      />
    </div>
  );
}

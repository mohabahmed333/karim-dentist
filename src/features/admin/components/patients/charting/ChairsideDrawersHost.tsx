"use client";

import type { NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import type { usePatientImaging } from "../usePatientImaging";
import type { usePatientToothNotes } from "../usePatientToothNotes";
import type { usePatientTreatments } from "../usePatientTreatments";
import { ChartingDrawers } from "./ChartingDrawers";
import { DiagnosticBody } from "./DiagnosticBody";
import { SurfacePaintPad } from "./SurfacePaintPad";
import type { DiagTab } from "./useChartingSession";
import { emptySurfaces } from "@/services/tooth_surfaces";

type Props = {
  inspectorOpen: boolean;
  onCloseInspector: () => void;
  builderOpen: boolean;
  onCloseBuilder: () => void;
  selectedFdi: string | null;
  toothLabel: string;
  diagTab: DiagTab;
  onDiagTab: (tab: DiagTab) => void;
  patientKey: string;
  notation: NotationSystem;
  paintTool: PaintTool;
  surfaces: SurfaceMap;
  onPaint: (fdi: string, surface: SurfaceId) => void;
  notesChart: ReturnType<typeof usePatientToothNotes>;
  imagingChart: ReturnType<typeof usePatientImaging>;
  treatmentsChart: ReturnType<typeof usePatientTreatments>;
};

export function ChairsideDrawersHost({
  inspectorOpen,
  onCloseInspector,
  builderOpen,
  onCloseBuilder,
  selectedFdi,
  toothLabel,
  diagTab,
  onDiagTab,
  patientKey,
  notation,
  paintTool,
  surfaces,
  onPaint,
  notesChart,
  imagingChart,
  treatmentsChart,
}: Props) {
  return (
    <ChartingDrawers
      inspectorOpen={inspectorOpen}
      onCloseInspector={onCloseInspector}
      builderOpen={builderOpen}
      onCloseBuilder={onCloseBuilder}
      selectedFdi={selectedFdi}
      toothLabel={toothLabel}
      toothShort={selectedFdi}
      diagTab={diagTab}
      onDiagTab={onDiagTab}
      diagnosticBody={
        <>
          {selectedFdi ? (
            <SurfacePaintPad
              fdi={selectedFdi}
              notation={notation}
              surfaces={surfaces ?? emptySurfaces()}
              tool={paintTool}
              onPaint={onPaint}
            />
          ) : null}
          <DiagnosticBody
            tab={diagTab}
            selectedFdi={selectedFdi}
            patientKey={patientKey}
            imaging={imagingChart.items}
            onUploaded={(row) => imagingChart.prepend([row])}
            notesChart={notesChart}
          />
        </>
      }
      onAddProcedure={(code, fee) => {
        if (!selectedFdi) return;
        void treatmentsChart.addCdtProcedure(selectedFdi, code, fee);
        onCloseBuilder();
      }}
    />
  );
}

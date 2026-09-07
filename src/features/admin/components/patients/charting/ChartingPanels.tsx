"use client";

import type { ReactNode } from "react";
import type { CdtPhase } from "@/services/cdt";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import { ChartingGltfOdontogram } from "./gltf/ChartingGltfOdontogram";
import { CHART_BENTO } from "./chartingSkin";
import { ChartingCard } from "./ChartingCard";
import { CdtPlanner } from "./CdtPlanner";

type Props = {
  ring: (id: "chart" | "diagnostics" | "planner") => string;
  chartHeader: ReactNode;
  dentition: Dentition;
  notation: NotationSystem;
  selectedFdi: string | null;
  paintTool: PaintTool;
  byFdi: Map<string, SurfaceMap>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
  items: TreatmentItem[];
  onAdd: (code: string, fee: number) => void;
  onPhase: (id: string, phase: CdtPhase) => void;
  onDelete: (id: string) => void;
  onBookRow: (id: string, mode: "book" | "replace") => void;
  onBookSelected: () => void;
  onAddNote: (procedureId: string, label: string) => void;
};

export function ChartingPanels(props: Props) {
  return (
    <div className={CHART_BENTO}>
      <ChartingCard tour="chart" ring={props.ring("chart")}>
        {props.chartHeader}
        <ChartingGltfOdontogram
          dentition={props.dentition}
          notation={props.notation}
          selectedFdi={props.selectedFdi}
          tool={props.paintTool}
          byFdi={props.byFdi}
          onSelect={props.onSelect}
          onDeselect={props.onDeselect}
          onPaint={props.onPaint}
        />
      </ChartingCard>
      <ChartingCard tour="planner" ring={props.ring("planner")}>
        <CdtPlanner
          items={props.items}
          selectedFdi={props.selectedFdi}
          notation={props.notation}
          onAdd={props.onAdd}
          onPhase={props.onPhase}
          onDelete={props.onDelete}
          onBookRow={props.onBookRow}
          onBookSelected={props.onBookSelected}
          onAddNote={props.onAddNote}
        />
      </ChartingCard>
    </div>
  );
}

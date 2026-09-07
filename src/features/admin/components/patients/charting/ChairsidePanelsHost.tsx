"use client";

import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import type { CdtPhase } from "@/services/cdt";
import type { TreatmentItem } from "@/services/patient_treatments";
import { ChartingPanels } from "./ChartingPanels";
import { ChartingToolbar } from "./ChartingToolbar";

type Props = {
  ring: (id: "chart" | "diagnostics" | "planner") => string;
  notation: NotationSystem;
  onNotation: (value: NotationSystem) => void;
  dentition: Dentition;
  onDentition: (value: Dentition) => void;
  paintTool: PaintTool;
  onPaintTool: (value: PaintTool) => void;
  selectedFdi: string | null;
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

export function ChairsidePanelsHost(props: Props) {
  return (
    <ChartingPanels
      ring={props.ring}
      chartHeader={
        <ChartingToolbar
          notation={props.notation}
          onNotation={props.onNotation}
          dentition={props.dentition}
          onDentition={props.onDentition}
          paintTool={props.paintTool}
          onPaintTool={props.onPaintTool}
        />
      }
      dentition={props.dentition}
      notation={props.notation}
      selectedFdi={props.selectedFdi}
      paintTool={props.paintTool}
      byFdi={props.byFdi}
      onSelect={props.onSelect}
      onDeselect={props.onDeselect}
      onPaint={props.onPaint}
      items={props.items}
      onAdd={props.onAdd}
      onPhase={props.onPhase}
      onDelete={props.onDelete}
      onBookRow={props.onBookRow}
      onBookSelected={props.onBookSelected}
      onAddNote={props.onAddNote}
    />
  );
}

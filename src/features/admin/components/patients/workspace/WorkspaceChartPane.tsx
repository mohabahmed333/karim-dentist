"use client";

import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import { TeethChartCanvas } from "../teeth-charts/TeethChartCanvas";
import { TeethChartPicker } from "../teeth-charts/TeethChartPicker";
import { ChartingGltfOdontogram } from "../charting/gltf/ChartingGltfOdontogram";

type Props = {
  notation: NotationSystem;
  dentition: Dentition;
  paintTool: PaintTool;
  chartStyle: TeethChartStyle;
  /** Omitted leaves the chart fixed — the showreel wants one scripted shape. */
  onChartStyleChange?: (style: TeethChartStyle) => void;
  selectedFdi: string | null;
  byFdi: Map<string, SurfaceMap>;
  commented: Set<string>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
  /** FDIs with an existing treatment record — highlighted alongside the selection. */
  markedFdis?: string[];
};

export function WorkspaceChartPane(props: Props) {
  const model = props.chartStyle === "model";
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {props.onChartStyleChange ? (
        <div className="mb-2 shrink-0">
          <TeethChartPicker
            value={props.chartStyle}
            onChange={props.onChartStyleChange}
          />
        </div>
      ) : null}
      {/* The chart takes whatever height the pane has left, so every shape
          still gets one box and switching moves nothing — a fixed 26rem just
          left the rest of the column empty.

          The floor is what makes that safe. `flex-1` only fills when every
          ancestor up to the shell has a definite height, and one indefinite
          link anywhere in that chain collapses the chart to nothing; the
          viewport-minus-chrome floor means the worst case is still a taller
          chart than the 26rem this replaced. */}
      <div className="relative flex min-h-[max(20rem,calc(100dvh-28rem))] w-full flex-1 flex-col bg-transparent">
        {model ? (
          <ChartingGltfOdontogram
            fill
            dentition={props.dentition}
            notation={props.notation}
            selectedFdi={props.selectedFdi}
            tool={props.paintTool}
            byFdi={props.byFdi}
            onSelect={props.onSelect}
            onDeselect={props.onDeselect}
            onPaint={props.onPaint}
            markedFdis={props.markedFdis}
          />
        ) : (
          <TeethChartCanvas
            fill
            style={props.chartStyle}
            selectedFdi={props.selectedFdi}
            hoveredFdi={null}
            commented={props.commented}
            onSelect={props.onSelect}
            onHover={() => undefined}
            onDeselect={props.onDeselect}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import {
  TeethChartCanvas,
  TOOTH_CHART_HEIGHT,
} from "../teeth-charts/TeethChartCanvas";
import { TeethChartPicker } from "../teeth-charts/TeethChartPicker";
import { ChartingGltfOdontogram } from "../charting/gltf/ChartingGltfOdontogram";
import { cn } from "@/lib/utils";

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
      {/* The 3D model takes the same fixed height as the flat charts, so
          switching shape never moves anything below it. */}
      <div className={cn("relative w-full bg-transparent", TOOTH_CHART_HEIGHT)}>
        {model ? (
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
        ) : (
          <TeethChartCanvas
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

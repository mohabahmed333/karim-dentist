"use client";

import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import type { TeethChartStyle } from "../teeth-charts/chartStyles";
import { TeethChartCanvas } from "../teeth-charts/TeethChartCanvas";
import { ChartingGltfOdontogram } from "../charting/gltf/ChartingGltfOdontogram";

type Props = {
  notation: NotationSystem;
  dentition: Dentition;
  paintTool: PaintTool;
  chartStyle: TeethChartStyle;
  selectedFdi: string | null;
  byFdi: Map<string, SurfaceMap>;
  commented: Set<string>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
};

export function WorkspaceChartPane(props: Props) {
  const anatomic = props.chartStyle === "anatomic";
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 bg-transparent">
        {anatomic ? (
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

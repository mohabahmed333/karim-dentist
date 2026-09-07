"use client";

import { useEffect } from "react";
import {
  adjacentChartFdi,
  ADULT_LOWER_LEFT,
  ADULT_LOWER_RIGHT,
  ADULT_UPPER_LEFT,
  ADULT_UPPER_RIGHT,
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_UPPER_RIGHT,
  type Dentition,
  type NotationSystem,
} from "@/services/notation";
import {
  emptySurfaces,
  type PaintTool,
  type SurfaceId,
  type SurfaceMap,
} from "@/services/tooth_surfaces";
import { SurfaceToothGlyph } from "./SurfaceToothGlyph";
import { CHART_PAPER } from "./chartingSkin";

type Props = {
  dentition: Dentition;
  notation: NotationSystem;
  selectedFdi: string | null;
  tool: PaintTool;
  byFdi: Map<string, SurfaceMap>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
};

function Arch({
  ids,
  ...rest
}: { ids: readonly string[] } & Omit<Props, "dentition">) {
  return (
    <div className="flex flex-nowrap justify-center gap-x-0.5 overflow-x-auto pb-1">
      {ids.map((fdi) => (
        <SurfaceToothGlyph
          key={fdi}
          fdi={fdi}
          notation={rest.notation}
          selected={rest.selectedFdi === fdi}
          surfaces={rest.byFdi.get(fdi) ?? emptySurfaces()}
          tool={rest.tool}
          onSelect={rest.onSelect}
          onPaint={rest.onPaint}
        />
      ))}
    </div>
  );
}

export function SurfaceOdontogram(props: Props) {
  const primary = props.dentition === "primary";
  const upper = primary
    ? [...PRIMARY_UPPER_RIGHT, ...PRIMARY_UPPER_LEFT]
    : [...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT];
  const lower = primary
    ? [...PRIMARY_LOWER_RIGHT, ...PRIMARY_LOWER_LEFT]
    : [...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        props.onDeselect();
        return;
      }
      if (!props.selectedFdi) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        props.onSelect(
          adjacentChartFdi(props.selectedFdi, props.dentition, "next"),
        );
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        props.onSelect(
          adjacentChartFdi(props.selectedFdi, props.dentition, "prev"),
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  return (
    <div className={`${CHART_PAPER} mt-4 min-h-0 flex-1 space-y-4 overflow-auto`}>
      <Arch ids={upper} {...props} />
      <div className="h-px bg-[#E2E8F0]" />
      <Arch ids={lower} {...props} />
    </div>
  );
}

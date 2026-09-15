"use client";

import { useMemo } from "react";
import {
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  toothVisualState,
  type FdiNumber,
} from "@/services/patient_tooth_findings/fdi";
import {
  ODONTOGRAM_VIEWBOX,
  odontogramPositions,
} from "@/services/patient_tooth_findings/fdiLayout";
import {
  TOOTH_ACTIVE_LABEL,
  TOOTH_FILL_SOLID,
  TOOTH_HOVER_FILL,
  TOOTH_HOVER_STROKE,
  TOOTH_STROKE,
} from "./toothChartColors";

type Props = {
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
  onDeselect: () => void;
};

const ALL: FdiNumber[] = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_RIGHT,
  ...LOWER_LEFT,
] as FdiNumber[];

export function CirclesChart({
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
  onDeselect,
}: Props) {
  const positions = useMemo(() => odontogramPositions(), []);
  const { width, height } = ODONTOGRAM_VIEWBOX;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Circle tooth chart"
    >
      <rect
        width={width}
        height={height}
        fill="transparent"
        onClick={onDeselect}
      />
      {ALL.map((fdi) => {
        const pos = positions[fdi];
        if (!pos) return null;
        const state = toothVisualState(fdi, selectedFdi, commented);
        const hovered = fdi === hoveredFdi && state !== "active";
        const fill = hovered
          ? TOOTH_HOVER_FILL
          : TOOTH_FILL_SOLID[state];
        const stroke =
          hovered && state === "unmarked"
            ? TOOTH_HOVER_STROKE
            : TOOTH_STROKE[state];

        return (
          <g
            key={fdi}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(fdi)}
            onMouseEnter={() => onHover(fdi)}
            onMouseLeave={() => onHover(null)}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={14}
              fill={fill}
              stroke={stroke}
              strokeWidth={state === "active" ? 2.2 : 1.4}
            />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              fontWeight={state === "active" || hovered ? 700 : 500}
              fill={
                state === "active" ? TOOTH_ACTIVE_LABEL : "var(--admin-text)"
              }
              style={{ pointerEvents: "none" }}
            >
              {fdi}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

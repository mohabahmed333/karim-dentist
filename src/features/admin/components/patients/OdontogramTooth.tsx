"use client";

import {
  toothType,
  toothVisualState,
  type ToothVisualState,
} from "@/services/patient_tooth_findings/fdi";
import type { ToothPosition } from "@/services/patient_tooth_findings/fdiLayout";
import { TOOTH_GLYPHS, TOOTH_SCALE } from "./toothPaths";

type Props = {
  position: ToothPosition;
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
};

const STROKE: Record<ToothVisualState, string> = {
  unmarked: "#d1d5db",
  "has-comment": "#2563eb",
  active: "#1d4ed8",
};

export function OdontogramTooth({
  position,
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
}: Props) {
  const state = toothVisualState(position.fdi, selectedFdi, commented);
  const hovered = position.fdi === hoveredFdi && state !== "active";
  const kind = toothType(position.fdi);
  const glyph = TOOTH_GLYPHS[kind];
  const scale = TOOTH_SCALE[kind];
  const filled = state !== "unmarked" || hovered;
  const stroke = hovered && state === "unmarked" ? "#93c5fd" : STROKE[state];

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={state !== "unmarked"}
      aria-label={`Tooth ${position.fdi}`}
      data-showreel-action="odontogram-tooth"
      data-fdi={position.fdi}
      className="cursor-pointer outline-none"
      transform={`translate(${position.x} ${position.y}) rotate(${position.rotate}) scale(${scale})`}
      onClick={() => onSelect(position.fdi)}
      onMouseEnter={() => onHover(position.fdi)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(position.fdi)}
      onBlur={() => onHover(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(position.fdi);
        }
      }}
    >
      <path
        d={glyph.outline}
        fill={filled ? "#dbeafe" : "none"}
        stroke={stroke}
        strokeWidth={state === "active" ? 2 : hovered ? 1.6 : 1.3}
        strokeDasharray={state === "active" ? "3 2" : undefined}
        strokeLinejoin="round"
      />
      {glyph.grooves.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={0.8}
          opacity={0.5}
        />
      ))}
    </g>
  );
}

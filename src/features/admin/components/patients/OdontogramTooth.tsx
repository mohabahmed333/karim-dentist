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

/**
 * Everything the chart paints comes off `--admin-primary`, which the clinic can
 * change from the DB at runtime — so no fixed blues. `color-mix` keeps one hue
 * across the three states instead of picking three unrelated swatches.
 */
const STROKE: Record<ToothVisualState, string> = {
  unmarked: "var(--admin-border)",
  "has-comment": "color-mix(in srgb, var(--admin-primary) 55%, transparent)",
  active: "var(--admin-primary)",
};

const FILL: Record<ToothVisualState, string> = {
  unmarked: "color-mix(in srgb, var(--admin-primary) 14%, transparent)",
  "has-comment": "color-mix(in srgb, var(--admin-primary) 18%, transparent)",
  active: "color-mix(in srgb, var(--admin-primary) 34%, transparent)",
};

const HOVER_STROKE = "color-mix(in srgb, var(--admin-primary) 45%, transparent)";

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
  const stroke = hovered && state === "unmarked" ? HOVER_STROKE : STROKE[state];

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
        fill={filled ? FILL[state] : "none"}
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

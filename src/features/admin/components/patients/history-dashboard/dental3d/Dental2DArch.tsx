"use client";

import type { ToothConditionInfo } from "./dental3d.types";

const VB_W = 220;
const VB_H = 200;
const CX = 110;

function archXY(
  t: number,
  opts: { cx: number; halfW: number; depth: number; baseY: number },
) {
  const x = opts.cx + opts.halfW * t;
  const y = opts.baseY - opts.depth * (1 - t * t);
  return { x, y };
}

function upperPos(idx: number) {
  const t = (idx / 15) * 2 - 1;
  return archXY(t, { cx: CX, halfW: 88, depth: 36, baseY: 78 });
}

function lowerPos(idx: number) {
  const t = (idx / 15) * 2 - 1;
  return archXY(-t, { cx: CX, halfW: 78, depth: 30, baseY: 138 });
}

const UPPER_IDS = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_IDS = Array.from({ length: 16 }, (_, i) => i + 17);

/** Circles slightly larger at molars, overlapping along the arch */
function toothRadius(idx: number): number {
  const mid = 7.5;
  const dist = Math.abs(idx - mid) / mid;
  return 7.2 + dist * 3.4;
}

type Props = {
  selectedToothId: number | null;
  toothConditions?: Record<number, ToothConditionInfo>;
  highlightColor?: string;
  onToothClick: (id: number) => void;
  onToothHover?: (id: number | null) => void;
};

export function Dental2DArch({
  selectedToothId,
  toothConditions = {},
  highlightColor = "#D4F06B",
  onToothClick,
  onToothHover,
}: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-full w-full"
      style={{ display: "block", background: "transparent" }}
      role="group"
      aria-label="Dental arch"
    >
      {UPPER_IDS.map((id, idx) => {
        const { x, y } = upperPos(idx);
        return (
          <ToothCircle
            key={id}
            id={id}
            cx={x}
            cy={y}
            r={toothRadius(idx)}
            cond={toothConditions[id]}
            selected={id === selectedToothId}
            highlightColor={highlightColor}
            onClick={onToothClick}
            onHover={onToothHover}
          />
        );
      })}

      {LOWER_IDS.map((id, idx) => {
        const { x, y } = lowerPos(idx);
        return (
          <ToothCircle
            key={id}
            id={id}
            cx={x}
            cy={y}
            r={toothRadius(idx)}
            cond={toothConditions[id]}
            selected={id === selectedToothId}
            highlightColor={highlightColor}
            onClick={onToothClick}
            onHover={onToothHover}
          />
        );
      })}
    </svg>
  );
}

type ToothCircleProps = {
  id: number;
  cx: number;
  cy: number;
  r: number;
  cond?: ToothConditionInfo;
  selected: boolean;
  highlightColor: string;
  onClick: (id: number) => void;
  onHover?: (id: number | null) => void;
};

function ToothCircle({
  id,
  cx,
  cy,
  r,
  cond,
  selected,
  highlightColor,
  onClick,
  onHover,
}: ToothCircleProps) {
  const marked = Boolean(cond);
  const fill = selected
    ? highlightColor
    : marked
      ? "rgba(255,255,255,0.95)"
      : "rgba(255,255,255,0.72)";
  const stroke = selected ? "#111111" : marked ? "#F97316" : "rgba(17,17,17,0.14)";
  const strokeW = selected ? 2.2 : marked ? 1.6 : 1;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Tooth ${id}${selected ? ", selected" : ""}${marked ? `, ${cond?.count ?? 0} records` : ""}`}
      aria-pressed={selected}
      style={{ cursor: "pointer" }}
      onClick={() => onClick(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(id)}
      onBlur={() => onHover?.(null)}
    >
      {/* hit target */}
      <circle cx={cx} cy={cy} r={r + 1.5} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        className="transition-[fill,stroke] duration-150"
      />
      {marked && !selected ? (
        <circle cx={cx} cy={cy - r + 1.5} r={1.7} fill="#F97316" />
      ) : null}
      {(selected || marked) && (
        <text
          x={cx}
          y={cy + 1.6}
          textAnchor="middle"
          fontSize={selected ? 5.5 : 4.2}
          fontWeight="700"
          fill="#111111"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {selected ? id : (cond?.count ?? id)}
        </text>
      )}
    </g>
  );
}

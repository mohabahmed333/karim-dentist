"use client";

import {
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  toothVisualState,
  type FdiNumber,
} from "@/services/patient_tooth_findings/fdi";

type Props = {
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
  onDeselect: () => void;
};

const UPPER = [...UPPER_RIGHT, ...UPPER_LEFT] as FdiNumber[];
const LOWER = [...LOWER_RIGHT, ...LOWER_LEFT] as FdiNumber[];

function archPoint(t: number, halfW: number, depth: number, baseY: number) {
  const x = 100 + halfW * t;
  const y = baseY - depth * (1 - t * t);
  return { x, y };
}

function toothSize(idx: number) {
  const mid = 7.5;
  const dist = Math.abs(idx - mid) / mid;
  return { rw: 4 + dist * 3.5, rh: 5.5 + dist * 2.5 };
}

export function ArchEllipseChart({
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
  onDeselect,
}: Props) {
  return (
    <svg
      viewBox="0 0 200 170"
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Arch tooth chart"
    >
      <rect width={200} height={170} fill="transparent" onClick={onDeselect} />
      <path
        d={guidePath(76, 30, 68)}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1.2}
      />
      <path
        d={guidePath(66, 24, 118)}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1.2}
      />
      {UPPER.map((fdi, idx) => {
        const t = (idx / 15) * 2 - 1;
        const { x, y } = archPoint(t, 72, 28, 70);
        const { rw, rh } = toothSize(idx);
        return (
          <ToothEllipse
            key={fdi}
            fdi={fdi}
            cx={x}
            cy={y}
            rw={rw}
            rh={rh}
            selectedFdi={selectedFdi}
            hoveredFdi={hoveredFdi}
            commented={commented}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
      {LOWER.map((fdi, idx) => {
        const t = (idx / 15) * 2 - 1;
        const { x, y } = archPoint(t, 62, 22, 118);
        const { rw, rh } = toothSize(idx);
        return (
          <ToothEllipse
            key={fdi}
            fdi={fdi}
            cx={x}
            cy={y}
            rw={rw}
            rh={rh}
            selectedFdi={selectedFdi}
            hoveredFdi={hoveredFdi}
            commented={commented}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </svg>
  );
}

function guidePath(halfW: number, depth: number, baseY: number) {
  const pts = Array.from({ length: 33 }, (_, i) => {
    const t = (i / 32) * 2 - 1;
    const { x, y } = archPoint(t, halfW, depth, baseY);
    return `${x},${y}`;
  });
  return `M ${pts.join(" L ")}`;
}

function ToothEllipse({
  fdi,
  cx,
  cy,
  rw,
  rh,
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
}: {
  fdi: FdiNumber;
  cx: number;
  cy: number;
  rw: number;
  rh: number;
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
}) {
  const state = toothVisualState(fdi, selectedFdi, commented);
  const hovered = fdi === hoveredFdi && state !== "active";
  const fill =
    state === "active" ? "#E2F163" : state === "has-comment" || hovered ? "#dbeafe" : "#fafafa";
  const stroke =
    state === "active" ? "#111111" : state === "has-comment" ? "#2563eb" : hovered ? "#93c5fd" : "#d1d5db";

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(fdi)}
      onMouseEnter={() => onHover(fdi)}
      onMouseLeave={() => onHover(null)}
    >
      <ellipse
        cx={cx}
        cy={cy}
        rx={rw}
        ry={rh}
        fill={fill}
        stroke={stroke}
        strokeWidth={state === "active" ? 1.6 : 1}
      />
      {(state === "active" || hovered) && (
        <text
          x={cx}
          y={cy + 1.5}
          textAnchor="middle"
          fontSize={3.5}
          fontWeight={700}
          fill="#111"
          style={{ pointerEvents: "none" }}
        >
          {fdi}
        </text>
      )}
    </g>
  );
}

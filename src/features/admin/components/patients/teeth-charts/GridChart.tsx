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

const ROWS: { label: string; ids: FdiNumber[] }[] = [
  { label: "UR", ids: [...UPPER_RIGHT] as FdiNumber[] },
  { label: "UL", ids: [...UPPER_LEFT] as FdiNumber[] },
  { label: "LL", ids: [...LOWER_LEFT] as FdiNumber[] },
  { label: "LR", ids: [...LOWER_RIGHT] as FdiNumber[] },
];

export function GridChart({
  selectedFdi,
  hoveredFdi,
  commented,
  onSelect,
  onHover,
  onDeselect,
}: Props) {
  return (
    <div className="space-y-3" onClick={onDeselect}>
      {ROWS.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="w-7 shrink-0 text-[10px] font-semibold tracking-wide text-[#9ca3af]">
            {row.label}
          </span>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {row.ids.map((fdi) => {
              const state = toothVisualState(fdi, selectedFdi, commented);
              const hovered = fdi === hoveredFdi && state !== "active";
              return (
                <button
                  key={fdi}
                  type="button"
                  title={`Tooth ${fdi}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(fdi);
                  }}
                  onMouseEnter={() => onHover(fdi)}
                  onMouseLeave={() => onHover(null)}
                  className={`flex h-9 min-w-9 flex-1 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                    state === "active"
                      ? "bg-[#E2F163] text-[#111111]"
                      : state === "has-comment"
                        ? "bg-blue-50 text-blue-700"
                        : hovered
                          ? "bg-blue-50 text-[#111111]"
                          : "bg-[#f2f2f2] text-[#6b7280] hover:bg-[#eef0f2]"
                  }`}
                >
                  {fdi}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

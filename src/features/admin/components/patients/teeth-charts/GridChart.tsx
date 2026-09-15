"use client";

import {
  LOWER_LEFT,
  LOWER_RIGHT,
  UPPER_LEFT,
  UPPER_RIGHT,
  toothVisualState,
  type FdiNumber,
} from "@/services/patient_tooth_findings/fdi";
import { cn } from "@/lib/utils";

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
          <span className="w-7 shrink-0 text-[10px] font-semibold tracking-wide text-[var(--admin-muted)]">
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
                  className={cn(
                    "flex h-9 min-w-9 flex-1 items-center justify-center rounded-lg text-[11px] font-semibold transition",
                    state === "active"
                      ? "bg-[var(--admin-primary)] text-white"
                      : state === "has-comment"
                        ? "bg-[color-mix(in_srgb,var(--admin-primary)_22%,transparent)] text-[var(--admin-text)]"
                        : hovered
                          ? "bg-[color-mix(in_srgb,var(--admin-primary)_12%,transparent)] text-[var(--admin-text)]"
                          : "bg-[var(--admin-hover)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
                  )}
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

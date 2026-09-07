"use client";

import type { ViewMode } from "./dental3d.types";

const MODES: { value: ViewMode; label: string }[] = [
  { value: "LATERAL",        label: "Lateral" },
  { value: "UPPER_OCCLUSAL", label: "Upper" },
  { value: "LOWER_OCCLUSAL", label: "Lower" },
  { value: "SINGLE_TOOTH",   label: "Focus" },
];

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-full bg-black/30 p-1 backdrop-blur-md">
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          onClick={() => onChange(mode.value)}
          className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-all ${
            value === mode.value
              ? "bg-[#E2F163] text-[#111111]"
              : "text-white/70 hover:text-white"
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}

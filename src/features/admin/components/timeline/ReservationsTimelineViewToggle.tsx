"use client";

import { cn } from "@/lib/utils";

export type TimelineViewMode = "patient" | "appointment";

type Props = {
  value: TimelineViewMode;
  onChange: (value: TimelineViewMode) => void;
};

const options: { value: TimelineViewMode; label: string }[] = [
  { value: "patient", label: "By patient" },
  { value: "appointment", label: "By appointment" },
];

export function ReservationsTimelineViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full border border-[#e6e8ec] bg-white p-0.5 text-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "rounded-full px-3 py-2 font-medium transition",
            value === option.value
              ? "bg-[#0f2744] text-white"
              : "text-[#6b7280] hover:text-[#0f2744]",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

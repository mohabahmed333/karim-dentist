"use client";

import { cn } from "@/lib/utils";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";

export type TimelineViewMode = "patient" | "appointment";

type Props = {
  value: TimelineViewMode;
  onChange: (value: TimelineViewMode) => void;
};

const options: { value: TimelineViewMode; labelKey: AdminMessageKey }[] = [
  { value: "patient", labelKey: "admin.reservations.byPatient" },
  { value: "appointment", labelKey: "admin.reservations.byAppointment" },
];

export function ReservationsTimelineViewToggle({ value, onChange }: Props) {
  const t = useTranslations();
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
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  );
}

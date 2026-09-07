"use client";

import type { ReservationFilter } from "@/features/admin/hooks/useReservationEditor";
import { cn } from "@/lib/utils";

const filters: { id: ReservationFilter; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "pending", label: "Pending" },
  { id: "all", label: "All" },
];

type Props = {
  value: ReservationFilter;
  onChange: (value: ReservationFilter) => void;
};

export function ReservationFilters({ value, onChange }: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition",
            value === item.id
              ? "bg-[#c9a962] text-white"
              : "bg-white text-[#6b7280] ring-1 ring-[#e6e8ec] hover:text-[#0f2744]",
          )}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

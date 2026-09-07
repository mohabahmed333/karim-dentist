"use client";

import { SlidersHorizontal } from "lucide-react";
import type { TimelineStatusFilter } from "@/services/reservations/timeline";
import { RESERVATION_STATUSES } from "@/services/reservations/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const labels: Record<TimelineStatusFilter, string> = {
  all: "All statuses",
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

type Props = {
  value: TimelineStatusFilter;
  onChange: (value: TimelineStatusFilter) => void;
  activeCount: number;
};

export function ReservationsTimelineFilters({
  value,
  onChange,
  activeCount,
}: Props) {
  const isFiltered = value !== "all";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
          isFiltered
            ? "border-[#c9a962] bg-[#c9a962]/10 text-[#0f2744]"
            : "border-[#e6e8ec] bg-white text-[#0f2744] hover:bg-white",
        )}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filter
        {isFiltered ? (
          <span className="rounded-full bg-[#c9a962] px-1.5 py-0.5 text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => onChange("all")}>
          {labels.all}
        </DropdownMenuItem>
        {RESERVATION_STATUSES.map((status) => (
          <DropdownMenuItem key={status} onClick={() => onChange(status)}>
            {labels[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

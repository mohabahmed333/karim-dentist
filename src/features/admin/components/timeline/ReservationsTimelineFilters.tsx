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
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";

const LABEL_KEYS: Record<TimelineStatusFilter, AdminMessageKey> = {
  all: "admin.reservations.allStatuses",
  pending: "admin.reservations.pending",
  confirmed: "admin.reservations.confirmed",
  completed: "admin.reservations.completed",
  cancelled: "admin.reservations.cancelled",
  no_show: "admin.reservations.noShow",
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
  const t = useTranslations();
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
        {t("admin.reservations.filter")}
        {isFiltered ? (
          <span className="rounded-full bg-[#c9a962] px-1.5 py-0.5 text-[10px] text-white">
            {activeCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={() => onChange("all")}>
          {t(LABEL_KEYS.all)}
        </DropdownMenuItem>
        {RESERVATION_STATUSES.map((status) => (
          <DropdownMenuItem key={status} onClick={() => onChange(status)}>
            {t(LABEL_KEYS[status])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import type { PatientTimelineFilter } from "@/services/reservations/patientHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSearchInput } from "@/features/admin/ui";
import { cn } from "@/lib/utils";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";

const LABEL_KEYS: Record<PatientTimelineFilter, AdminMessageKey> = {
  all: "admin.reservations.allPatients",
  returning: "admin.reservations.returning",
  new: "admin.reservations.newPatients",
  upcoming: "admin.reservations.hasUpcoming",
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  filter: PatientTimelineFilter;
  onFilterChange: (value: PatientTimelineFilter) => void;
};

export function ReservationsTimelinePatientFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: Props) {
  const t = useTranslations();
  const isFiltered = filter !== "all";

  return (
    <>
      <AdminSearchInput
        containerClassName="min-w-[10rem] flex-1 sm:min-w-[12rem]"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("admin.reservations.searchPatientPhone")}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
            isFiltered
              ? "border-[#c9a962] bg-[#c9a962]/10 text-[#0f2744]"
              : "border-[#e6e8ec] bg-white text-[#0f2744] hover:bg-white",
          )}
        >
          {t("admin.nav.patients")}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {(Object.keys(LABEL_KEYS) as PatientTimelineFilter[]).map((key) => (
            <DropdownMenuItem key={key} onClick={() => onFilterChange(key)}>
              {t(LABEL_KEYS[key])}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

"use client";

import { Search } from "lucide-react";
import type { PatientTimelineFilter } from "@/services/reservations/patientHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const labels: Record<PatientTimelineFilter, string> = {
  all: "All patients",
  returning: "Returning",
  new: "New patients",
  upcoming: "Has upcoming",
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
  const isFiltered = filter !== "all";

  return (
    <>
      <div className="relative min-w-[10rem] flex-1 sm:min-w-[12rem]">
        <Search
          className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-[#6b7280]"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search patient or phone"
          className="rounded-full border-[#e6e8ec] bg-white ps-9"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
            isFiltered
              ? "border-[#c9a962] bg-[#c9a962]/10 text-[#0f2744]"
              : "border-[#e6e8ec] bg-white text-[#0f2744] hover:bg-white",
          )}
        >
          Patients
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {(Object.keys(labels) as PatientTimelineFilter[]).map((key) => (
            <DropdownMenuItem key={key} onClick={() => onFilterChange(key)}>
              {labels[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

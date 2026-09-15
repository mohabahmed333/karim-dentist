"use client";

import { Filter, Plus } from "lucide-react";
import { AdminSearchInput } from "@/features/admin/ui";
import type { TreatmentSeverity } from "@/services/patient_treatments";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  severityFilter: TreatmentSeverity | "All";
  onSeverityFilter: (value: TreatmentSeverity | "All") => void;
  onAdd: () => void;
};

export function TreatmentsToolbar({
  query,
  onQueryChange,
  severityFilter,
  onSeverityFilter,
  onAdd,
}: Props) {
  const pill =
    "inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-[12px] font-medium text-[#0F172A] shadow-sm transition hover:bg-slate-50";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AdminSearchInput
        containerClassName="w-40"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search…"
        className="h-8 text-[12px]"
      />
      <button
        type="button"
        className={pill}
        onClick={() =>
          onSeverityFilter(
            severityFilter === "All"
              ? "Critical"
              : severityFilter === "Critical"
                ? "Minor"
                : "All",
          )
        }
      >
        <Filter className="size-3.5" />
        {severityFilter === "All" ? "Filter" : severityFilter}
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
        onClick={onAdd}
      >
        <Plus className="size-3.5" />
        Add
      </button>
    </div>
  );
}

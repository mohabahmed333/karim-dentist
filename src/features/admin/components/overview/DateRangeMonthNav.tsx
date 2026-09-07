"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  filterMenuChipActiveClass,
  filterMenuChipClass,
} from "@/components/ui/filter-menu/filterMenuStyles";

type Props = {
  view: Date;
  years: number[];
  yearOpen: boolean;
  locale: string;
  prevLabel: string;
  nextLabel: string;
  onYearOpenChange: (open: boolean) => void;
  onViewChange: (view: Date) => void;
};

export function DateRangeMonthNav({
  view,
  years,
  yearOpen,
  locale,
  prevLabel,
  nextLabel,
  onYearOpenChange,
  onViewChange,
}: Props) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={prevLabel}
          className="rounded-md p-1 text-[var(--admin-muted,#6b6f76)] hover:bg-[var(--admin-hover,#eeeff1)]"
          onClick={() =>
            onViewChange(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-[4.5rem] text-center text-sm font-semibold">
          {view.toLocaleDateString(locale, { month: "long" })}
        </span>
        <button
          type="button"
          aria-label={nextLabel}
          className="rounded-md p-1 text-[var(--admin-muted,#6b6f76)] hover:bg-[var(--admin-hover,#eeeff1)]"
          onClick={() =>
            onViewChange(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => onYearOpenChange(!yearOpen)}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] px-2.5 py-1 text-sm font-medium hover:bg-[var(--admin-hover,#eeeff1)]"
        >
          {view.getFullYear()}
          <ChevronDown className="size-3.5 text-[var(--admin-muted,#6b6f76)]" />
        </button>
        {yearOpen ? (
          <div className="admin-card absolute top-[calc(100%+6px)] end-0 z-20 w-[17rem] rounded-lg border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] p-2.5">
            <div className="grid grid-cols-4 gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    onViewChange(new Date(y, view.getMonth(), 1));
                    onYearOpenChange(false);
                  }}
                  className={
                    y === view.getFullYear()
                      ? filterMenuChipActiveClass
                      : filterMenuChipClass
                  }
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

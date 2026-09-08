"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  formatSingleDate,
  presetIdForRange,
  RANGE_PRESET_MESSAGE_KEYS,
  rangeFromPreset,
  type CompareMode,
  type DateRange,
  type RangePresetId,
  COMPARE_OPTIONS,
} from "@/features/admin/lib/dateRangeModel";
import { DashboardDateRangePicker } from "./DashboardDateRangePicker";
import {
  AdminDropdownMenu,
  AdminDropdownMenuContent,
  AdminDropdownMenuItem,
  AdminDropdownMenuTrigger,
  AdminFieldButton,
  adminFieldButtonClass,
} from "@/features/admin/ui";
import { useLocale, useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

type Props = {
  range: DateRange;
  compare: CompareMode;
  onRangeChange: (range: DateRange, presetId: RangePresetId | "custom") => void;
  onCompareChange: (mode: CompareMode) => void;
};

export function DashboardFiltersBar({
  range,
  compare,
  onRangeChange,
  onCompareChange,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [pickerOpen, setPickerOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const presetId = presetIdForRange(range);
  const presetLabel =
    presetId === "custom"
      ? t("admin.date.custom")
      : t(RANGE_PRESET_MESSAGE_KEYS[presetId] as AdminMessageKey);
  const compareLabel =
    COMPARE_OPTIONS.find((o) => o.id === compare)?.label ??
    t("admin.reservations.previousPeriod");

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-2">
      <div className="relative">
        <AdminFieldButton
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
        >
          <span className="font-medium">{presetLabel}</span>
          <ChevronDown className="size-3.5 text-[var(--admin-muted)]" />
          <span className="h-4 w-px bg-[var(--admin-border)]" />
          <CalendarDays className="size-3.5 text-[var(--admin-muted)]" />
          <span>{formatSingleDate(range.start, dateLocale)}</span>
        </AdminFieldButton>
        <DashboardDateRangePicker
          open={pickerOpen}
          value={range}
          onClose={() => setPickerOpen(false)}
          onApply={(next, nextPreset) => {
            onRangeChange(next, nextPreset);
            setPickerOpen(false);
          }}
        />
      </div>

      <span className="text-xs text-[var(--admin-muted)]">
        {t("admin.filters.compare")}
      </span>

      <AdminDropdownMenu
        onOpenChange={(open) => {
          if (open) setPickerOpen(false);
        }}
      >
        <AdminDropdownMenuTrigger
          className={`${adminFieldButtonClass} gap-2`}
        >
          <span>{compareLabel}</span>
          <ChevronDown className="size-3.5 text-[var(--admin-muted)]" />
        </AdminDropdownMenuTrigger>
        <AdminDropdownMenuContent align="start" className="min-w-[12rem]">
          {COMPARE_OPTIONS.map((opt) => (
            <AdminDropdownMenuItem
              key={opt.id}
              onClick={() => onCompareChange(opt.id)}
              className={
                compare === opt.id
                  ? "font-semibold"
                  : "text-[var(--admin-muted)]"
              }
            >
              {opt.label}
            </AdminDropdownMenuItem>
          ))}
        </AdminDropdownMenuContent>
      </AdminDropdownMenu>
    </div>
  );
}

export function defaultDashboardRange(): DateRange {
  return rangeFromPreset("today");
}

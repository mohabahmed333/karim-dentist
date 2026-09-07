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
  const [compareOpen, setCompareOpen] = useState(false);
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
        setCompareOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex flex-wrap items-center gap-2"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setPickerOpen((v) => !v);
            setCompareOpen(false);
          }}
          className="admin-card inline-flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel,#ffffff)] px-3 py-2 text-sm text-[var(--admin-text)]"
        >
          <span className="font-medium">{presetLabel}</span>
          <ChevronDown className="size-3.5 text-[var(--admin-muted)]" />
          <span className="h-4 w-px bg-[var(--admin-border)]" />
          <CalendarDays className="size-3.5 text-[var(--admin-muted)]" />
          <span>{formatSingleDate(range.start, dateLocale)}</span>
        </button>
        <DashboardDateRangePicker
          open={pickerOpen}
          value={range}
          onClose={() => setPickerOpen(false)}
          onApply={(next, presetId) => {
            onRangeChange(next, presetId);
            setPickerOpen(false);
          }}
        />
      </div>

      <span className="text-xs text-[var(--admin-muted)]">
        {t("admin.filters.compare")}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setCompareOpen((v) => !v);
            setPickerOpen(false);
          }}
          className="admin-card inline-flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel,#ffffff)] px-3 py-2 text-sm text-[var(--admin-text)]"
        >
          <span>{compareLabel}</span>
          <ChevronDown className="size-3.5 text-[var(--admin-muted)]" />
        </button>
        {compareOpen ? (
          <div className="admin-card absolute top-[calc(100%+8px)] start-0 z-50 min-w-[12rem] rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel,#ffffff)] py-1">
            {COMPARE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onCompareChange(opt.id);
                  setCompareOpen(false);
                }}
                className={`block w-full px-3 py-2 text-start text-sm hover:bg-[var(--admin-hover)] ${
                  compare === opt.id
                    ? "font-semibold text-[var(--admin-text)]"
                    : "text-[var(--admin-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function defaultDashboardRange(): DateRange {
  return rangeFromPreset("today");
}

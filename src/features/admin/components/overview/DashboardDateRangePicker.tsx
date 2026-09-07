"use client";

import {
  formatRangeLabel,
  RANGE_PRESETS,
  RANGE_PRESET_MESSAGE_KEYS,
  type DateRange,
  type RangePresetId,
} from "@/features/admin/lib/dateRangeModel";
import { cn } from "@/lib/utils";
import {
  filterMenuChipActiveClass,
  filterMenuChipClass,
} from "@/components/ui/filter-menu/filterMenuStyles";
import { useLocale, useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import { DateRangeCalendarGrid } from "./DateRangeCalendarGrid";
import { DateRangeMonthNav } from "./DateRangeMonthNav";
import { useDateRangePickerState } from "./useDateRangePickerState";

type Props = {
  open: boolean;
  value: DateRange;
  onClose: () => void;
  onApply: (range: DateRange, presetId: RangePresetId | "custom") => void;
  placement?: "anchored" | "inline";
};

export function DashboardDateRangePicker({
  open,
  value,
  onClose,
  onApply,
  placement = "anchored",
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const state = useDateRangePickerState(open, value);
  if (!open) return null;

  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";

  return (
    <div
      className={cn(
        "admin-card overflow-hidden rounded-xl border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] p-4 pb-0 text-[var(--admin-text,#1a1a1a)]",
        placement === "anchored"
          ? "absolute top-[calc(100%+8px)] start-0 z-50 w-[min(100vw-2rem,28rem)]"
          : "relative w-[min(100vw-2rem,28rem)]",
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <p className="mb-3 text-sm font-semibold">{t("admin.date.selectFor")}</p>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => state.pickPreset(preset.id, onApply)}
            className={
              state.activePreset === preset.id
                ? filterMenuChipActiveClass
                : filterMenuChipClass
            }
          >
            {t(RANGE_PRESET_MESSAGE_KEYS[preset.id] as AdminMessageKey)}
          </button>
        ))}
      </div>

      <div dir="ltr">
        <DateRangeMonthNav
          view={state.view}
          years={state.years}
          yearOpen={state.yearOpen}
          locale={dateLocale}
          prevLabel={t("admin.date.prevMonth")}
          nextLabel={t("admin.date.nextMonth")}
          onYearOpenChange={state.setYearOpen}
          onViewChange={state.setView}
        />
        <DateRangeCalendarGrid
          view={state.view}
          draft={state.draft}
          onPickDay={(day) => state.pickDay(day, onApply)}
        />
      </div>

      <div className="-mx-4 mt-4 flex items-center justify-between gap-2.5 border-t border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] px-4 py-3">
        <p className="min-w-0 flex-1 text-start text-[12px] leading-snug break-words">
          <span className="font-medium text-[var(--admin-muted,#6b6f76)]">
            {t("admin.date.range")}:
          </span>{" "}
          <span className="font-semibold">
            {formatRangeLabel(state.draft, dateLocale)}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            state.setDraft(value);
            onClose();
          }}
          className="shrink-0 rounded-md border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#ffffff)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--admin-muted,#6b6f76)] hover:bg-[var(--admin-hover,#eeeff1)] hover:text-[var(--admin-text,#1a1a1a)]"
        >
          {t("admin.cancel")}
        </button>
      </div>
    </div>
  );
}

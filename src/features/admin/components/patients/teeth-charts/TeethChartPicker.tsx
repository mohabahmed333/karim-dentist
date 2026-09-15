"use client";

import { TEETH_CHART_STYLES, type TeethChartStyle } from "./chartStyles";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChartStyleThumb } from "./ChartStyleThumb";

type Props = {
  value: TeethChartStyle;
  onChange: (style: TeethChartStyle) => void;
};

export function TeethChartPicker({ value, onChange }: Props) {
  const t = useTranslations();
  return (
    <div
      role="radiogroup"
      aria-label={t("admin.chartStyle.legend")}
      className="flex flex-wrap gap-2"
    >
      {TEETH_CHART_STYLES.map((style) => {
        const active = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(style.labelKey)}
            title={t(style.hintKey)}
            onClick={() => onChange(style.id)}
            className={cn(
              "flex w-[4.75rem] flex-col items-center gap-1 rounded-2xl p-2 transition",
              active
                ? "bg-[var(--admin-primary)] text-white"
                : "bg-[var(--admin-hover)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
            )}
          >
            <ChartStyleThumb styleId={style.id} active={active} />
            <span className="text-[10px] font-medium leading-none">
              {t(style.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

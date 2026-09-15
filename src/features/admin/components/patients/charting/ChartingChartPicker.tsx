"use client";

import {
  CHARTING_CHART_STYLES,
  type ChartingChartStyle,
} from "./chartingChartStyles";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  value: ChartingChartStyle;
  onChange: (style: ChartingChartStyle) => void;
};

export function ChartingChartPicker({ value, onChange }: Props) {
  const t = useTranslations();
  return (
    <div
      role="radiogroup"
      aria-label={t("admin.chartStyle.legend")}
      className="flex flex-wrap gap-1"
    >
      {CHARTING_CHART_STYLES.map((style) => {
        const active = style.id === value;
        return (
          <button
            key={style.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(style.hintKey)}
            onClick={() => onChange(style.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium",
              active
                ? "bg-[var(--admin-primary)] text-white"
                : "bg-[var(--admin-hover)] text-[var(--admin-muted)] hover:text-[var(--admin-text)]",
            )}
          >
            {t(style.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

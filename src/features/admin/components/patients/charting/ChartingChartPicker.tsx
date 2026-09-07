"use client";

import {
  CHARTING_CHART_STYLES,
  type ChartingChartStyle,
} from "./chartingChartStyles";

type Props = {
  value: ChartingChartStyle;
  onChange: (style: ChartingChartStyle) => void;
};

export function ChartingChartPicker({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Chart style"
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
            title={style.hint}
            onClick={() => onChange(style.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              active
                ? "bg-[#1E293B] text-white"
                : "bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            {style.label}
          </button>
        );
      })}
    </div>
  );
}

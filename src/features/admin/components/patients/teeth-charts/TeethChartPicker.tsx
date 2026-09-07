"use client";

import { TEETH_CHART_STYLES, type TeethChartStyle } from "./chartStyles";
import { ChartStyleThumb } from "./ChartStyleThumb";

type Props = {
  value: TeethChartStyle;
  onChange: (style: TeethChartStyle) => void;
};

export function TeethChartPicker({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Tooth chart shape"
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
            aria-label={style.label}
            title={style.hint}
            onClick={() => onChange(style.id)}
            className={`flex w-[4.75rem] flex-col items-center gap-1 rounded-2xl p-2 transition ${
              active
                ? "bg-[#111111] text-white"
                : "bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111]"
            }`}
          >
            <ChartStyleThumb styleId={style.id} active={active} />
            <span className="text-[10px] font-medium leading-none">
              {style.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

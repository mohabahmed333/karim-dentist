"use client";

import type { ShapeSchema } from "../canvas.types";

type Props = { title: string; schema?: ShapeSchema };

export function PerioProbingNode({ title, schema }: Props) {
  const bars = schema?.barChartData ?? [
    { label: "1", value: 3, max: 8 },
    { label: "2", value: 5, max: 8 },
    { label: "3", value: 2, max: 8 },
    { label: "4", value: 6, max: 8 },
  ];
  return (
    <article className="w-[210px] rounded-2xl bg-[#111111] p-4 text-white shadow-xl">
      <p className="text-[11px] text-white/70">{title}</p>
      <p className="mt-1 text-[10px] text-white/50">Pocket depth 1–8 mm</p>
      <div className="mt-3 flex items-end gap-1">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-20 w-full items-end rounded bg-white/10 p-0.5">
              <span
                className="w-full rounded-sm bg-[#E2F163]"
                style={{ height: `${((bar.value / (bar.max ?? 8)) * 100).toFixed(0)}%` }}
              />
            </div>
            <span className="text-[8px] text-white/45">{bar.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

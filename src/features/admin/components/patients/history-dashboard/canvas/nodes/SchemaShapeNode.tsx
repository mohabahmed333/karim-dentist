"use client";

import type { ShapeSchema } from "../canvas.types";

type Props = { schema: ShapeSchema; title: string };

export function SchemaShapeNode({ schema, title }: Props) {
  const dark = schema.theme !== "light";
  return (
    <article
      className={`w-[220px] rounded-2xl p-4 shadow-lg ${
        dark ? "bg-[#111111] text-white" : "border border-gray-100 bg-white text-[#111111]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] ${dark ? "text-white/70" : "text-[#111111]/60"}`}>
          {schema.header ?? title}
        </p>
        {schema.badgeColor ? (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: schema.badgeColor }}
          />
        ) : null}
      </div>
      {schema.metrics?.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {schema.metrics.map((metric) => (
            <div key={metric.label} className={`rounded-lg p-2 ${dark ? "bg-white/5" : "bg-[#EBEAE5]"}`}>
              <p className="text-[9px] opacity-60">{metric.label}</p>
              <p className="text-[13px] font-medium">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {schema.barChartData?.length ? (
        <div className="mt-3 flex items-end gap-1.5">
          {schema.barChartData.map((bar) => (
            <div key={bar.label} className="flex flex-1 flex-col items-center gap-1">
              <div className={`flex h-16 w-full items-end rounded-md p-0.5 ${dark ? "bg-white/10" : "bg-[#EBEAE5]"}`}>
                <span
                  className="w-full rounded-sm bg-[#E2F163]"
                  style={{ height: `${((bar.value / (bar.max ?? 8)) * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="text-[9px] opacity-60">{bar.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      {schema.mediaGrid?.length ? (
        <div className="mt-3 grid grid-cols-2 gap-1">
          {schema.mediaGrid.map((cell) => (
            <div
              key={cell.label}
              className={`flex aspect-square items-center justify-center rounded-lg text-[9px] ${
                dark ? "bg-white/10 text-white/60" : "bg-[#EBEAE5] text-[#111111]/50"
              }`}
            >
              {cell.label}
            </div>
          ))}
        </div>
      ) : null}
      {schema.footerBadge ? (
        <span className="mt-3 inline-flex rounded-full bg-[#E2F163] px-2 py-0.5 text-[10px] font-medium text-[#111111]">
          {schema.footerBadge}
        </span>
      ) : null}
    </article>
  );
}

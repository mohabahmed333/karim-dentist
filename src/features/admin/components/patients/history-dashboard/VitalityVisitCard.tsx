"use client";

import { VitalityDotChart } from "./VitalityDotChart";

type Props = { hot?: boolean };

export function VitalityVisitCard({ hot = false }: Props) {
  return (
    <article
      data-anchor="vitality"
      className={`w-full rounded-[28px] bg-[#111111] px-5 py-4 text-white shadow-[0_18px_40px_rgba(17,17,17,0.22)] transition-shadow ${
        hot ? "ring-2 ring-[#E2F163]" : ""
      }`}
    >
      <p className="text-[11px] leading-snug text-white/70">
        Office Visit: Tooth #14 Pulpectomy
      </p>
      <p className="mt-3 text-[28px] leading-none font-medium tracking-tight">62–180</p>
      <p className="mt-1 text-[11px] text-white/55">bpm / Vitality Index</p>
      <VitalityDotChart />
    </article>
  );
}

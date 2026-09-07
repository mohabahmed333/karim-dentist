"use client";

import { VitalityDotChart } from "../../VitalityDotChart";

type Props = { title: string; metric?: string };

export function MetricBentoNode({ title, metric = "62–180 bpm / Vitality Index" }: Props) {
  return (
    <article className="w-[230px] rounded-3xl bg-[#111111] p-5 text-white shadow-xl">
      <p className="text-[11px] leading-snug text-white/70">{title}</p>
      <p className="mt-3 text-[28px] leading-none font-medium tracking-tight">62–180</p>
      <p className="mt-1 text-[11px] text-white/55">{metric}</p>
      <VitalityDotChart />
    </article>
  );
}

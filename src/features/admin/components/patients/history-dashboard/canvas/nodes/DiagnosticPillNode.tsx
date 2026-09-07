"use client";

import { Stethoscope } from "lucide-react";

type Props = { title: string; date?: string };

export function DiagnosticPillNode({ title, date = "07.10" }: Props) {
  return (
    <article className="w-[210px] rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <Stethoscope className="mb-2 size-4 text-[#111111]/70" aria-hidden />
      <p className="text-[12px] leading-snug font-medium text-[#111111]">{title}</p>
      <span className="mt-3 inline-flex rounded-full bg-[#EBEAE5] px-2.5 py-0.5 text-[11px] text-[#111111]">
        {date}
      </span>
    </article>
  );
}

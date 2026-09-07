"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { ApexWaveform } from "../../ApexWaveform";

type Props = { title: string; expanded?: boolean };

export function SourceConditionNode({ title, expanded = true }: Props) {
  return (
    <div className="w-[228px]">
      <div className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-3 pl-1.5 shadow-[0_10px_24px_rgba(17,17,17,0.08)]">
        <span className="hx-badge-glow flex size-8 items-center justify-center rounded-full bg-[#E2F163]">
          <span className="size-2 rounded-full bg-[#111111]" />
        </span>
        <span className="text-[13px] font-medium text-[#111111]">{title}</span>
        {expanded ? <ChevronUp className="ml-auto size-3.5" /> : <ChevronDown className="ml-auto size-3.5" />}
      </div>
      {expanded ? (
        <div className="mt-2 w-[188px] rounded-2xl bg-[#111111] px-3 py-2.5 text-white shadow-[0_16px_36px_rgba(17,17,17,0.28)]">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] leading-tight text-white/75">Apex Locator / Vitality</p>
            <span className="text-sm leading-none text-[#ef4444]">🦷</span>
          </div>
          <ApexWaveform />
        </div>
      ) : null}
    </div>
  );
}

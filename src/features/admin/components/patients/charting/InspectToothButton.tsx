"use client";

import { Search } from "lucide-react";

type Props = {
  disabled: boolean;
  onInspect: () => void;
};

export function InspectToothButton({ disabled, onInspect }: Props) {
  if (disabled) return null;
  return (
    <button
      type="button"
      onClick={onInspect}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] shadow-sm transition hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]"
    >
      <Search className="size-3.5 text-[#2563EB]" />
      Inspect Tooth Details
    </button>
  );
}

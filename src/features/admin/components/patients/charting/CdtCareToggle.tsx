"use client";

import type { CareBucket } from "@/services/cdt";

type Props = {
  bucket: CareBucket;
  onToggle: () => void;
};

export function CdtCareToggle({ bucket, onToggle }: Props) {
  const immediate = bucket === "immediate";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={immediate}
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
        immediate
          ? "bg-[#FEF2F2] text-[#DC2626]"
          : "bg-[#EFF6FF] text-[#2563EB]"
      }`}
    >
      {immediate ? "Immediate" : "Planned"}
    </button>
  );
}

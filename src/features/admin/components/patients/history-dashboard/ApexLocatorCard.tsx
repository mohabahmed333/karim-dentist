"use client";

import { Heart } from "lucide-react";
import { ApexWaveform } from "./ApexWaveform";

export function ApexLocatorCard() {
  return (
    <div className="w-[188px] rounded-2xl bg-[#111111] px-3 py-2.5 text-white shadow-[0_16px_36px_rgba(17,17,17,0.28)]">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-tight text-white/75">
          Apex Locator / Pulp Vitality
        </p>
        <Heart className="size-3.5 shrink-0 fill-[#ef4444] text-[#ef4444]" />
      </div>
      <ApexWaveform />
    </div>
  );
}

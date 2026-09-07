"use client";

import { Button } from "@/components/ui/button";
import type { CSSProperties } from "react";

type Props = {
  stepIndex: number;
  stepCount: number;
  title: string;
  body: string;
  style: CSSProperties;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function CustomizeTourCard({
  stepIndex,
  stepCount,
  title,
  body,
  style,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const last = stepIndex >= stepCount - 1;
  return (
    <div
      className="pointer-events-auto fixed z-[510] w-[min(340px,calc(100vw-2rem))] rounded-xl border border-[#e5e5e5] bg-white p-4 text-[#1a1a1a] shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
      style={style}
      data-tour-card=""
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
        {stepIndex + 1} / {stepCount}
      </p>
      <h2 className="mt-1 text-sm font-semibold text-[#1a1a1a]">{title}</h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b6b6b]">{body}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-xs text-[#1a1a1a] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          onClick={onSkip}
        >
          Exit
        </Button>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-8 border-[#1a1a1a] bg-[#1a1a1a] px-2.5 text-xs text-white hover:bg-[#333] hover:text-white"
            disabled={stepIndex === 0}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            className="h-8 bg-[#1a1a1a] px-2.5 text-xs text-white hover:bg-[#333]"
            onClick={onNext}
          >
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  onPrev: () => void;
  onNext: () => void;
};

export function CaretStepper({ onPrev, onNext }: Props) {
  return (
    <div className="flex flex-col overflow-hidden rounded-full bg-white shadow-[0_8px_18px_rgba(17,17,17,0.1)]">
      <button
        type="button"
        aria-label="Previous condition"
        onClick={onPrev}
        className="px-1.5 pt-1 pb-0.5 text-[#111111]"
      >
        <ChevronUp className="size-3" strokeWidth={2.4} />
      </button>
      <button
        type="button"
        aria-label="Next condition"
        onClick={onNext}
        className="px-1.5 pt-0.5 pb-1 text-[#111111]"
      >
        <ChevronDown className="size-3" strokeWidth={2.4} />
      </button>
    </div>
  );
}

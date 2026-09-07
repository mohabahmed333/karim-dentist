"use client";

import { CHARTING_TOUR_STEPS, type ChartingTourStep } from "./chartingTour";

type Props = {
  step: ChartingTourStep;
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function ChartingTourCard({
  step,
  stepIndex,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const last = stepIndex >= CHARTING_TOUR_STEPS.length - 1;
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
      <p className="text-[11px] font-medium tracking-wide text-[#6b7280] uppercase">
        {stepIndex + 1} / {CHARTING_TOUR_STEPS.length}
      </p>
      <h2 className="mt-1 text-sm font-medium text-[#111111]">{step.title}</h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b7280]">{step.body}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" className="text-[12px] text-[#6b7280]" onClick={onSkip}>
          Skip
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={onBack}
            className="h-8 rounded-full border border-[#e5e7eb] px-3 text-[12px] disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="h-8 rounded-full bg-[#2563eb] px-3 text-[12px] font-medium text-white"
          >
            {last ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

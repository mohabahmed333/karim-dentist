"use client";

import { InspectToothButton } from "./InspectToothButton";

type Props = {
  hasTooth: boolean;
  onInspect: () => void;
  onReplayTour: () => void;
};

export function ChairsideChartChrome({
  hasTooth,
  onInspect,
  onReplayTour,
}: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
      <InspectToothButton disabled={!hasTooth} onInspect={onInspect} />
      <button
        type="button"
        onClick={onReplayTour}
        className="text-[12px] font-medium text-[#2563EB]"
      >
        How this page works
      </button>
    </div>
  );
}

"use client";

import { Minus, Plus } from "lucide-react";
import { DEFAULT_ZOOM_LEVELS } from "./scrubber.types";

type Props = {
  scale: number;
  onChange: (scale: number) => void;
};

export function TimelineZoomCluster({ scale, onChange }: Props) {
  const index = DEFAULT_ZOOM_LEVELS.findIndex((level) => level === scale);
  const atMin = index <= 0;
  const atMax = index >= DEFAULT_ZOOM_LEVELS.length - 1;

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-2 py-1">
      <button
        type="button"
        aria-label="Zoom out"
        disabled={atMin}
        onClick={() => onChange(DEFAULT_ZOOM_LEVELS[Math.max(0, index - 1)] ?? 1)}
        className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-white disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-[28px] text-center text-[11px] font-semibold text-[#111111]">
        {scale}x
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        disabled={atMax}
        onClick={() =>
          onChange(DEFAULT_ZOOM_LEVELS[Math.min(DEFAULT_ZOOM_LEVELS.length - 1, index + 1)] ?? 4)
        }
        className="flex size-8 items-center justify-center rounded-full bg-[#111111] text-white disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

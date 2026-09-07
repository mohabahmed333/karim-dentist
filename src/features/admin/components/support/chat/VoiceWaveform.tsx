"use client";

import { useRef } from "react";
import {
  seekRatioFromClientX,
  waveBarHeightPx,
} from "./voiceRecorderHelpers";

const BAR_PX = 2;
const TRACK_PX = 22;

type Props = {
  samples: number[];
  active?: boolean;
  /** 0–1 playhead when scrubbing / previewing. */
  progress?: number;
  interactive?: boolean;
  rtl?: boolean;
  onSeek?: (ratio: number) => void;
};

/**
 * Scrubbable waveform — played bars dark, remaining muted,
 * primary playhead (light-theme take on WhatsApp progress wave).
 */
export function VoiceWaveform({
  samples,
  active = false,
  progress,
  interactive = false,
  rtl = false,
  onSeek,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const showHead = typeof progress === "number";
  const n = Math.max(1, samples.length);

  function ratioFromEvent(clientX: number) {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return seekRatioFromClientX(clientX, rect.left, rect.width, rtl);
  }

  function bindSeek(clientX: number) {
    onSeek?.(ratioFromEvent(clientX));
  }

  return (
    <div
      ref={trackRef}
      role={interactive ? "slider" : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 100 : undefined}
      aria-valuenow={
        interactive && showHead ? Math.round((progress ?? 0) * 100) : undefined
      }
      tabIndex={interactive ? 0 : undefined}
      className={`relative grid h-6 min-w-0 w-full flex-1 items-center overflow-visible ${
        interactive ? "cursor-pointer touch-none select-none" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(${samples.length}, minmax(0, 1fr))`,
      }}
      onPointerDown={(e) => {
        if (!interactive || !onSeek) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragging.current = true;
        bindSeek(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        bindSeek(e.clientX);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      onKeyDown={(e) => {
        if (!interactive || !onSeek || !showHead) return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const step = e.key === "ArrowRight" ? 0.05 : -0.05;
          const delta = rtl ? -step : step;
          onSeek(Math.min(1, Math.max(0, (progress ?? 0) + delta)));
        }
      }}
    >
      {showHead ? (
        <span
          className="pointer-events-none absolute top-1/2 z-20 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--admin-primary)] ring-2 ring-white"
          style={{ insetInlineStart: `${(progress ?? 0) * 100}%` }}
        />
      ) : null}
      {samples.map((level, i) => {
        const at = (i + 0.5) / n;
        const played = showHead && at <= (progress ?? 0);
        const color = active
          ? "#8B929E"
          : showHead
            ? played
              ? "#111827"
              : "#C5CAD3"
            : "#8B929E";
        return (
          <span
            key={i}
            className="mx-auto block shrink-0 rounded-full"
            style={{
              width: BAR_PX,
              height: waveBarHeightPx(level, TRACK_PX, BAR_PX),
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}

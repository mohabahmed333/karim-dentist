"use client";

import type { TimelineHandleStyle } from "./scrubber.types";

type Props = {
  style: TimelineHandleStyle;
  side: "left" | "right";
  onPointerDown: (event: React.PointerEvent) => void;
};

export function TimelineHandle({ style, side, onPointerDown }: Props) {
  if (style === "PILL") {
    return (
      <span
        role="slider"
        aria-label={side === "left" ? "Range start" : "Range end"}
        onPointerDown={onPointerDown}
        className="absolute top-1/2 z-20 size-4 -translate-y-1/2 cursor-ew-resize rounded-full bg-[#111111] shadow-md"
        style={side === "left" ? { left: -8 } : { right: -8 }}
      />
    );
  }
  if (style === "DIAMOND") {
    return (
      <span
        role="slider"
        aria-label={side === "left" ? "Range start" : "Range end"}
        onPointerDown={onPointerDown}
        className="absolute top-1/2 z-20 size-3 -translate-y-1/2 rotate-45 cursor-ew-resize bg-[#111111]"
        style={side === "left" ? { left: -6 } : { right: -6 }}
      />
    );
  }
  return (
    <span
      role="slider"
      aria-label={side === "left" ? "Range start" : "Range end"}
      onPointerDown={onPointerDown}
      className="absolute top-0 bottom-0 z-20 w-1 cursor-ew-resize rounded-full bg-[#111111]"
      style={side === "left" ? { left: 0 } : { right: 0 }}
    />
  );
}

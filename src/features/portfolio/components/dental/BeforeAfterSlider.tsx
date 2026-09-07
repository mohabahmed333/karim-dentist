"use client";

import Image from "next/image";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { clampComparePosition } from "@/features/portfolio/lib/clampComparePosition";
import { cn } from "@/lib/utils";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  alt: string;
  beforeLabel: string;
  afterLabel: string;
  className?: string;
  customizeField?: string;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  alt,
  beforeLabel,
  afterLabel,
  className,
  customizeField,
}: Props) {
  const labelId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [position, setPosition] = useState(50);

  const setFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rtl = getComputedStyle(frame).direction === "rtl";
    const ratio = (clientX - rect.left) / rect.width;
    const next = rtl ? (1 - ratio) * 100 : ratio * 100;
    setPosition(clampComparePosition(next));
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setFromClientX(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = frameRef.current
      ? getComputedStyle(frameRef.current).direction === "rtl"
      : false;
    const step = rtl ? -2 : 2;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((value) => clampComparePosition(value - step));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((value) => clampComparePosition(value + step));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={frameRef}
      className={cn(
        "relative aspect-[4/3] w-full touch-none select-none overflow-hidden border border-[#e6e8ec] bg-[#0f2744]",
        className,
      )}
      data-no-carousel-drag
      data-customize-field={customizeField}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Image
        src={afterSrc}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={beforeSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          draggable={false}
          aria-hidden
        />
      </div>

      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/90"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/90 bg-white text-[#0f2744] shadow-[0_4px_14px_rgba(15,39,68,0.16)]">
          <span aria-hidden className="text-[10px] font-semibold tracking-tight">
            ‹ ›
          </span>
        </div>
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% ${beforeLabel}`}
        className="absolute inset-0 z-20 cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
        onKeyDown={onKeyDown}
      />

      <p id={labelId} className="sr-only">
        {beforeLabel} / {afterLabel}
      </p>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-between px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white drop-shadow">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
    </div>
  );
}

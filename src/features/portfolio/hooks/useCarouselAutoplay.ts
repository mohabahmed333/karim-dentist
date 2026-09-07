"use client";

import { useEffect, useRef } from "react";
import type { EmblaCarouselType } from "embla-carousel";

/** Infinite autoplay: prefers Embla loop + scrollNext, pauses while dragging. */
export function useCarouselAutoplay(
  emblaApi: EmblaCarouselType | undefined,
  enabled: boolean,
  delayMs: number,
) {
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!emblaApi || !enabled) return;
    const pause = () => {
      pausedRef.current = true;
    };
    const resume = () => {
      pausedRef.current = false;
    };
    emblaApi.on("pointerDown", pause);
    emblaApi.on("pointerUp", resume);
    return () => {
      emblaApi.off("pointerDown", pause);
      emblaApi.off("pointerUp", resume);
    };
  }, [emblaApi, enabled]);

  useEffect(() => {
    if (!emblaApi || !enabled) return;
    const id = window.setInterval(() => {
      if (document.hidden || pausedRef.current) return;
      emblaApi.scrollNext();
    }, delayMs);
    return () => window.clearInterval(id);
  }, [delayMs, emblaApi, enabled]);
}

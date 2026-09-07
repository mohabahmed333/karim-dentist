"use client";

import { useCallback, useEffect, useState } from "react";
import { SHOWREEL_SLIDES } from "./showreelSlides";

export function useShowreelDeck(autoStart = false) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoStart);

  const slide = SHOWREEL_SLIDES[index] ?? SHOWREEL_SLIDES[0];
  const total = SHOWREEL_SLIDES.length;

  const goTo = useCallback((next: number) => {
    setIndex((next + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => goTo(index + 1), slide.durationMs);
    return () => window.clearTimeout(timer);
  }, [playing, slide.durationMs, index, goTo]);

  return {
    slide,
    index,
    total,
    playing,
    setPlaying,
    goTo,
    next,
    prev,
  };
}

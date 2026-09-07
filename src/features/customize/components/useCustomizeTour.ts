"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TOUR_GUIDE_ID,
  getTourGuide,
  hasSeenCustomizeTour,
  markCustomizeTourSeen,
} from "../lib/customizeTour";
import type { TourGuide } from "../lib/tourTypes";

export function useCustomizeTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [guideId, setGuideId] = useState(DEFAULT_TOUR_GUIDE_ID);

  const guide: TourGuide =
    getTourGuide(guideId) ?? getTourGuide(DEFAULT_TOUR_GUIDE_ID)!;
  const steps = guide.steps;

  useEffect(() => {
    if (hasSeenCustomizeTour()) return;
    const timer = window.setTimeout(() => {
      setGuideId(DEFAULT_TOUR_GUIDE_ID);
      setStepIndex(0);
      setOpen(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, []);

  const finish = useCallback(() => {
    markCustomizeTourSeen();
    setOpen(false);
    setStepIndex(0);
  }, []);

  const startGuide = useCallback((id: string) => {
    const next = getTourGuide(id);
    if (!next?.steps.length) return;
    setGuideId(id);
    setStepIndex(0);
    setOpen(false);
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const start = useCallback(() => {
    startGuide(DEFAULT_TOUR_GUIDE_ID);
  }, [startGuide]);

  const next = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [finish, stepIndex, steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const step = useMemo(
    () => steps[stepIndex] ?? steps[0],
    [steps, stepIndex],
  );

  return {
    open,
    step,
    stepIndex,
    stepCount: steps.length,
    guideId: guide.id,
    start,
    startGuide,
    next,
    back,
    skip: finish,
  };
}

"use client";

import { useEffect, useState } from "react";
import {
  CHARTING_TOUR_KEY,
  CHARTING_TOUR_STEPS,
  shouldOpenChartingTour,
} from "./chartingTour";

export function useChartingTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setOpen(shouldOpenChartingTour(window.localStorage.getItem(CHARTING_TOUR_KEY)));
  }, []);

  const step = CHARTING_TOUR_STEPS[stepIndex] ?? CHARTING_TOUR_STEPS[0];

  function dismiss() {
    window.localStorage.setItem(CHARTING_TOUR_KEY, "1");
    setOpen(false);
    setStepIndex(0);
  }

  function replay() {
    setStepIndex(0);
    setOpen(true);
  }

  function next() {
    if (stepIndex >= CHARTING_TOUR_STEPS.length - 1) {
      dismiss();
      return;
    }
    setStepIndex((index) => index + 1);
  }

  function back() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function ring(id: (typeof CHARTING_TOUR_STEPS)[number]["id"]) {
    return open && step.id === id
      ? "ring-2 ring-[#2563EB] ring-offset-2 rounded-2xl"
      : "";
  }

  return { open, step, stepIndex, ring, next, back, dismiss, replay };
}

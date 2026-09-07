"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "../lib/customizeTour";
import { tourTooltipStyle } from "../lib/tourTooltipStyle";
import { CustomizeTourCard } from "./CustomizeTourCard";
import { CustomizeTourMask } from "./CustomizeTourMask";
import { useCustomizeTourKeys } from "./useCustomizeTourKeys";

type Rect = { top: number; left: number; width: number; height: number };

type Props = {
  open: boolean;
  step: TourStep;
  stepIndex: number;
  stepCount: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

function readTargetRect(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function CustomizeTour({
  open,
  step,
  stepIndex,
  stepCount,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => setMounted(true), []);
  useCustomizeTourKeys(open, stepIndex, onBack, onNext, onSkip);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const update = () => setRect(readTargetRect(step.target));
    update();
    const retry = window.setInterval(update, 100);
    const stop = window.setTimeout(() => window.clearInterval(retry), 1200);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(stop);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, step]);

  if (!mounted || !open) return null;

  const hole =
    step.target && rect
      ? {
          top: Math.max(0, rect.top - 8),
          left: Math.max(0, rect.left - 8),
          width: rect.width + 16,
          height: rect.height + 16,
        }
      : null;

  return createPortal(
    <div
      className="pointer-events-auto fixed inset-0 z-[500]"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      data-customize-tour=""
    >
      <CustomizeTourMask hole={hole} />
      <CustomizeTourCard
        stepIndex={stepIndex}
        stepCount={stepCount}
        title={step.title}
        body={step.body}
        style={tourTooltipStyle(hole, step.placement)}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
      />
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";

/** Keyboard nav for the tour; ignores keys briefly after open/step change. */
export function useCustomizeTourKeys(
  open: boolean,
  stepIndex: number,
  onBack: () => void,
  onNext: () => void,
  onSkip: () => void,
) {
  const [keysEnabled, setKeysEnabled] = useState(false);

  useEffect(() => {
    if (!open) {
      setKeysEnabled(false);
      return;
    }
    const enable = window.setTimeout(() => setKeysEnabled(true), 250);
    return () => window.clearTimeout(enable);
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open || !keysEnabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, keysEnabled, onSkip, onNext, onBack]);
}

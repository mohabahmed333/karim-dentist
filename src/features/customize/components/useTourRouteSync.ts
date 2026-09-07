"use client";

import { useEffect } from "react";
import type { CustomizeSection } from "../types";
import type { TourStep } from "../lib/tourTypes";

type RouteBits = {
  section: CustomizeSection;
  itemId: string | null;
  builderMode: boolean;
};

/** Keep Customize route + settings tab in sync with the active tour step. */
export function useTourRouteSync(
  open: boolean,
  step: TourStep,
  route: RouteBits,
  navigate: (target: { section: CustomizeSection }) => void,
) {
  useEffect(() => {
    if (!open) return;
    const section = step.ensureSection;
    if (section) {
      if (step.listView) {
        if (route.section !== section || route.itemId || route.builderMode) {
          navigate({ section });
        }
      } else if (route.section !== section) {
        navigate({ section });
      }
    }
    if (!step.settingsTab) return;
    const tab = step.settingsTab;
    const timer = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("customize-tour-settings-tab", { detail: tab }),
      );
    }, 80);
    return () => window.clearTimeout(timer);
  }, [
    open,
    step,
    route.section,
    route.itemId,
    route.builderMode,
    navigate,
  ]);
}

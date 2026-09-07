"use client";

import { useEffect, type RefObject } from "react";
import { postShowreelCustomizeDemo } from "./showreelEmbedMessage";
import type { ShowreelFeatureSlide } from "./showreelSlides";

const CASE_TITLE_STEPS = [
  "A Story in Motion",
  "A Story, Rewritten",
  "Imagineer — Case One",
];

/**
 * Parent-driven live customize demos for the active showreel slide.
 * Resets iframe state first so loops replay cleanly on persisted mounts.
 */
export function useShowreelCustomizeScript(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  slide: ShowreelFeatureSlide,
  enabled: boolean,
) {
  const script = slide.customizeScript;

  useEffect(() => {
    if (!enabled || !script) return;

    const iframe = () => iframeRef.current;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };

    postShowreelCustomizeDemo(iframe(), "reset");

    if (script === "case-title") {
      CASE_TITLE_STEPS.forEach((title, i) => {
        later(450 + i * 1100, () => {
          postShowreelCustomizeDemo(iframe(), "patchCaseStudy", { title });
        });
      });
    }

    if (script === "homepage-order") {
      // Swap case-studies (1) with featured (2) in default order.
      later(600, () => {
        postShowreelCustomizeDemo(iframe(), "reorderHomepage", {
          fromIndex: 1,
          toIndex: 2,
        });
      });
      later(2800, () => {
        postShowreelCustomizeDemo(iframe(), "reorderHomepage", {
          fromIndex: 2,
          toIndex: 0,
        });
      });
    }

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [enabled, iframeRef, script, slide.id]);
}

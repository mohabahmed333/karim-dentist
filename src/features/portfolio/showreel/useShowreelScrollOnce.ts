"use client";

import { useEffect, type RefObject } from "react";
import {
  showreelScrollTargetY,
  type ScrollTargetOptions,
} from "./showreelScrollTarget";

type Options = ScrollTargetOptions & {
  scrollMs?: number;
  delayMs?: number;
};

/** How often the end position is re-measured once the scroll has finished. */
const SETTLE_MS = 250;

function scrollToY(win: Window, top: number) {
  win.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
}

function getWindows(refs: RefObject<HTMLIFrameElement | null>[]) {
  return refs
    .map((ref) => ref.current?.contentWindow)
    .filter((win): win is Window => Boolean(win));
}

function winsReset(refs: RefObject<HTMLIFrameElement | null>[]) {
  getWindows(refs).forEach((win) => scrollToY(win, 0));
}

/** One scripted scroll per slide (for screen recording). */
export function useShowreelScrollOnce(
  iframeRefs: RefObject<HTMLIFrameElement | null>[],
  enabled: boolean,
  {
    scrollMs = 5200,
    maxProgress = 0.24,
    delayMs = 600,
    targetId,
    heroFirst,
    heroPhaseRatio = 0.42,
  }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let cancelled = false;
    const started = performance.now() + delayMs;
    const endsAt = started + scrollMs;

    const applyAll = (progress: number) => {
      getWindows(iframeRefs).forEach((win) =>
        scrollToY(
          win,
          showreelScrollTargetY(win, progress, {
            maxProgress,
            targetId,
            heroFirst,
            heroPhaseRatio,
          }),
        ),
      );
    };

    const tick = (now: number) => {
      if (cancelled) return;
      const wins = getWindows(iframeRefs);
      if (wins.length === 0 || now < started) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (now - started) / scrollMs);
      applyAll(t);

      if (t < 1) raf = requestAnimationFrame(tick);
    };

    winsReset(iframeRefs);
    raf = requestAnimationFrame(tick);

    // Hold the end position for the rest of the slide instead of pinning it
    // once. Lazy content below the fold only starts loading as the scroll
    // reaches it, so the page is still growing when the animation ends — a
    // single re-pin left the slide short of the bottom. This re-measures and
    // re-applies until the slide is swapped out, and no-ops until then.
    const settle = window.setInterval(() => {
      if (cancelled || performance.now() < endsAt + 200) return;
      applyAll(1);
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearInterval(settle);
    };
  }, [
    delayMs,
    enabled,
    heroFirst,
    heroPhaseRatio,
    iframeRefs,
    maxProgress,
    scrollMs,
    targetId,
  ]);
}

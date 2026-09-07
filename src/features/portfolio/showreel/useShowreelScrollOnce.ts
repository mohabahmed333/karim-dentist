"use client";

import { useEffect, type RefObject } from "react";

type Options = {
  scrollMs?: number;
  maxProgress?: number;
  delayMs?: number;
  targetId?: string;
  /** Scroll through hero scrub first, then continue down the page. */
  heroFirst?: boolean;
  /** Share of scroll time spent finishing the hero (0–1). */
  heroPhaseRatio?: number;
};

function easeHero(t: number) {
  return 1 - (1 - t) ** 2.8;
}

/** Faster zip through content below the hero. */
function easePostHero(t: number) {
  return t ** 2.4;
}

function scrollMax(win: Window) {
  const doc = win.document.documentElement;
  return Math.max(0, doc.scrollHeight - win.innerHeight);
}

function heroScrollEnd(win: Window) {
  const track = win.document.querySelector<HTMLElement>(".scroll-track");
  if (!track) return null;

  const scrollable = Math.max(0, track.offsetHeight - win.innerHeight);
  return Math.max(0, track.offsetTop + scrollable);
}

function targetScrollTop(win: Window, targetId: string) {
  const el = win.document.getElementById(targetId);
  if (!el) return null;

  const top = el.getBoundingClientRect().top + win.scrollY - 48;
  return Math.max(0, Math.min(top, scrollMax(win)));
}

function scrollToY(win: Window, top: number) {
  win.scrollTo({ top: Math.max(0, top), left: 0, behavior: "auto" });
}

function applyScroll(
  win: Window,
  progress: number,
  maxProgress: number,
  targetId?: string,
  heroFirst?: boolean,
  heroPhaseRatio = 0.42,
) {
  const pageMax = scrollMax(win) * maxProgress;

  if (targetId) {
    const targetTop = targetScrollTop(win, targetId);
    scrollToY(win, (targetTop ?? pageMax) * progress);
    return;
  }

  if (!heroFirst) {
    scrollToY(win, pageMax * progress);
    return;
  }

  const heroEnd = heroScrollEnd(win);
  if (heroEnd === null) {
    scrollToY(win, pageMax * progress);
    return;
  }

  const heroTarget = Math.min(heroEnd, pageMax);
  const restSpan = Math.max(0, pageMax - heroTarget);

  if (progress <= heroPhaseRatio) {
    const local = easeHero(progress / heroPhaseRatio);
    scrollToY(win, heroTarget * local);
    return;
  }

  const local = easePostHero((progress - heroPhaseRatio) / (1 - heroPhaseRatio));
  scrollToY(win, heroTarget + restSpan * local);
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

    const applyAll = (progress: number) => {
      getWindows(iframeRefs).forEach((win) =>
        applyScroll(
          win,
          progress,
          maxProgress,
          targetId,
          heroFirst,
          heroPhaseRatio,
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

    const retry = window.setTimeout(() => applyAll(1), scrollMs + delayMs + 200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(retry);
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

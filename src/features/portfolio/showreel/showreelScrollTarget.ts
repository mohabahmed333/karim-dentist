export type ScrollTargetOptions = {
  /** Share of the page to cover (1 = all the way to the bottom). */
  maxProgress?: number;
  targetId?: string;
  /** Scroll through the hero scrub first, then continue down the page. */
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

/**
 * Where the scripted slide scroll should sit at `progress` (0–1).
 *
 * Measured fresh on every call, never cached: lazy content below the fold
 * only starts loading once the scroll reaches it, so the bottom of the page
 * moves while the scroll is running and for a while after it ends.
 */
export function showreelScrollTargetY(
  win: Window,
  progress: number,
  {
    maxProgress = 0.24,
    targetId,
    heroFirst,
    heroPhaseRatio = 0.42,
  }: ScrollTargetOptions = {},
): number {
  const pageMax = scrollMax(win) * maxProgress;

  if (targetId) {
    const targetTop = targetScrollTop(win, targetId);
    return Math.max(0, (targetTop ?? pageMax) * progress);
  }

  const heroEnd = heroFirst ? heroScrollEnd(win) : null;
  if (heroEnd === null) return Math.max(0, pageMax * progress);

  const heroTarget = Math.min(heroEnd, pageMax);
  const restSpan = Math.max(0, pageMax - heroTarget);

  if (progress <= heroPhaseRatio) {
    return Math.max(0, heroTarget * easeHero(progress / heroPhaseRatio));
  }

  const local = easePostHero((progress - heroPhaseRatio) / (1 - heroPhaseRatio));
  return Math.max(0, heroTarget + restSpan * local);
}

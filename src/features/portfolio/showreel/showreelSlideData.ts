import type { ShowreelFeatureSlide, ShowreelSlide } from "./showreelSlideTypes";

const SITE_MOBILE = "/showreel/demo?mode=site&viewport=mobile";

const FEATURE = (
  id: string,
  kicker: string,
  title: string,
  body: string,
  tags: string[],
  desktopQuery: string,
  opts?: Partial<ShowreelFeatureSlide>,
): ShowreelFeatureSlide => {
  const isCustomize = desktopQuery.includes("mode=customize");

  return {
    id,
    kind: "feature",
    kicker,
    title,
    body,
    tags,
    durationMs: opts?.durationMs ?? 4800,
    desktopSrc: `/showreel/demo?${desktopQuery}`,
    mobileSrc: opts?.mobileSrc ?? SITE_MOBILE,
    scroll: opts?.scroll ?? false,
    scrollDepth: opts?.scrollDepth ?? 0.18,
    scrollMs: opts?.scrollMs ?? 3800,
    desktopOnly: isCustomize,
    customizeScript: opts?.customizeScript,
    scrollDelayMs: opts?.scrollDelayMs,
    scrollTarget: opts?.scrollTarget,
    scrollHeroFirst: opts?.scrollHeroFirst,
    scrollHeroPhaseRatio: opts?.scrollHeroPhaseRatio,
  };
};

export const SHOWREEL_SLIDES: ShowreelSlide[] = [
  {
    id: "intro",
    kind: "copy",
    durationMs: 5500,
    kicker: "Mohab Elbasiry",
    title: "A portfolio shaped like a film.",
    body: "You bring the idea. We imagine it together — then design, build, and choreograph every scene.",
    tags: ["Have an idea?", "Let's imagine together"],
  },
  FEATURE(
    "site",
    "Act I",
    "The opening frame",
    "Hero film, negative space, and slow reveals — the homepage breathes before it speaks.",
    ["Cinema", "Silence", "Depth"],
    "mode=site",
    {
      durationMs: 11200,
      scroll: true,
      scrollDepth: 1,
      scrollHeroFirst: true,
      scrollHeroPhaseRatio: 0.82,
      scrollMs: 10000,
      scrollDelayMs: 900,
    },
  ),
  FEATURE(
    "hero-cms",
    "Behind the lens",
    "First light",
    "The hero is tuned like a key frame — contrast, headline, and motion held in balance.",
    ["Contrast", "Focus", "Presence"],
    "mode=customize&section=hero",
  ),
  FEATURE(
    "case-edit-cms",
    "Behind the lens",
    "Edit the chapter",
    "Change a case study title and watch the live preview catch up in the same breath.",
    ["Live", "Title", "Preview"],
    "mode=customize&section=case-studies&item=first&focus=title",
    { durationMs: 8200, customizeScript: "case-title" },
  ),
  FEATURE(
    "order-cms",
    "Behind the lens",
    "Reorder the reel",
    "Drag homepage sections into a new sequence — the site reshapes as you decide.",
    ["Order", "Flow", "Live"],
    "mode=customize&section=settings&view=order",
    { durationMs: 7800, customizeScript: "homepage-order" },
  ),
  {
    id: "outro",
    kind: "outro",
    durationMs: 5500,
    kicker: "Designed and developed by",
    title: "Mohab Elbasiry",
    body: "What's next?",
  },
];

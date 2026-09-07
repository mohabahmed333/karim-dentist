import { gsap, prefersReducedMotion } from "./gsapClient";
import { IN_VIEW } from "./scrollTriggerDefaults";

type IndexConfig = {
  root: string;
  title: string;
  lede: string;
  grid: string;
  card: string;
};

const INDEX_PAGES: IndexConfig[] = [
  {
    root: ".cs-index",
    title: ".index-ruled-title",
    lede: ".index-ruled-lede",
    grid: ".cs-index-grid",
    card: ".cs-index-card",
  },
  {
    root: ".fp-index",
    title: ".index-ruled-title",
    lede: ".index-ruled-lede",
    grid: ".fp-index-grid",
    card: ".fp-index-card",
  },
];

function buildTo(from: Record<string, number>) {
  const to: Record<string, number> = { opacity: 1 };
  if (from.y !== undefined) to.y = 0;
  if (from.x !== undefined) to.x = 0;
  return to;
}

function animateIndexPage(scope: HTMLElement, config: IndexConfig) {
  const page = scope.querySelector(config.root);
  if (!page) return;

  const title = page.querySelector(config.title);
  const lede = page.querySelector(config.lede);
  const grid = page.querySelector(config.grid);
  const cards = page.querySelectorAll(config.card);

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

  if (title) {
    tl.fromTo(
      title,
      { y: 52, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.95 },
      0.08,
    );
  }

  if (lede) {
    tl.fromTo(
      lede,
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85 },
      "-=0.55",
    );
  }

  if (cards.length) {
    gsap.fromTo(
      cards,
      { y: 44, opacity: 0 },
      {
        ...buildTo({ y: 44, opacity: 0 }),
        duration: 0.82,
        stagger: 0.09,
        ease: "power2.out",
        scrollTrigger: {
          trigger: grid ?? page,
          start: "top 82%",
          toggleActions: "play none none none",
        },
      },
    );
  }
}

function animateDetailPage(scope: HTMLElement) {
  const page = scope.querySelector(".cs-page");
  if (!page) return;

  page.querySelectorAll(".cs-section-wrap").forEach((section) => {
    gsap.fromTo(
      section,
      { y: 48, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.88,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          ...IN_VIEW,
        },
      },
    );
  });
}

function animateDetailSubnav(scope: HTMLElement) {
  const subnav = scope.querySelector(".detail-page-subnav");
  if (!subnav || scope.querySelector(".customize-preview-canvas")) return;

  gsap.fromTo(
    subnav,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.12 },
  );
}

/** Index + detail motion for /case-studies, /featured, and slug pages. */
export function animateCollectionPages(scope: HTMLElement): void {
  if (prefersReducedMotion()) return;

  INDEX_PAGES.forEach((config) => animateIndexPage(scope, config));
  animateDetailPage(scope);
  animateDetailSubnav(scope);
}

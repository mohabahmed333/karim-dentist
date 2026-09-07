import { gsap, prefersReducedMotion } from "./gsapClient";

/** Gentle vertical parallax on homepage carousel media while the page scrolls. */
export function animateCarouselScroll(scope: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const blocks = [
    {
      section: "#case-studies",
      media: ".case-media img, .case-media video",
    },
    {
      section: "#featured",
      media: ".featured-card img, .featured-card video",
    },
  ] as const;

  for (const { section, media } of blocks) {
    const root = scope.querySelector(section);
    if (!root) continue;

    root.querySelectorAll<HTMLElement>(media).forEach((el) => {
      const card = el.closest("[data-carousel-card]");
      if (!card) return;

      gsap.fromTo(
        el,
        { y: 16 },
        {
          y: -16,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.65,
          },
        },
      );
    });
  }
}

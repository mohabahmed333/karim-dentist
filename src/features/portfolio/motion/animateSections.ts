import { gsap, prefersReducedMotion } from "./gsapClient";
import { animateExperienceRows } from "./animateExperience";
import { SECTION_REVEALS } from "./sectionReveals";
import { IN_VIEW } from "./scrollTriggerDefaults";

function buildTo(from: Record<string, number> | undefined) {
  const to: Record<string, number> = { opacity: 1 };
  if (from?.y !== undefined) to.y = 0;
  if (from?.x !== undefined) to.x = 0;
  return to;
}

/** Section reveals — replay on every scroll enter (up or down). */
export function animateSections(scope: HTMLElement): void {
  if (prefersReducedMotion()) return;

  SECTION_REVEALS.forEach(
    ({ trigger, targets, from, stagger = 0.08, duration = 0.8 }) => {
      const section = scope.querySelector(trigger);
      if (!section) return;
      const els = section.querySelectorAll(targets);
      if (!els.length) return;

      const isCarouselSlide =
        targets.includes(".case-card") || targets.includes(".featured-card");

      gsap.fromTo(
        els,
        { ...(from ?? { opacity: 0 }) },
        {
          ...buildTo(from),
          duration,
          ease: "power2.out",
          stagger,
          overwrite: "auto",
          // Keep Embla slide transforms free after the reveal finishes
          ...(isCarouselSlide ? { clearProps: "transform" } : {}),
          scrollTrigger: {
            trigger: section,
            ...IN_VIEW,
            // Don't reverse carousel slides on leave — avoids lag on tab refocus
            ...(isCarouselSlide
              ? { toggleActions: "play none none none" }
              : null),
          },
        },
      );
    },
  );

  animateExperienceRows(scope);
}

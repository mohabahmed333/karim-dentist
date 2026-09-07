import { gsap, prefersReducedMotion } from "./gsapClient";
import { IN_VIEW } from "./scrollTriggerDefaults";

/** Experience rows fade up in a soft stagger. */
export function animateExperienceRows(scope: HTMLElement): void {
  if (prefersReducedMotion()) return;
  const section = scope.querySelector("#experience");
  if (!section) return;

  const rows = section.querySelectorAll<HTMLElement>(".experience-entry");
  if (!rows.length) return;

  gsap.fromTo(
    rows,
    { y: 28, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.75,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        ...IN_VIEW,
      },
    },
  );
}

import { gsap, prefersReducedMotion } from "./gsapClient";
import { IN_VIEW } from "./scrollTriggerDefaults";

/** Layered callout: script rises in, then the SF Pro line sharpens over it. */
export function animateCallout(scope: HTMLElement): void {
  const section = scope.querySelector<HTMLElement>(".callout");
  if (!section || prefersReducedMotion()) return;

  const lead = section.querySelector<HTMLElement>(".callout-lead");
  const leadImage = section.querySelector<HTMLElement>(".callout-lead-image");
  const lines = section.querySelectorAll<HTMLElement>(".callout-line");
  const accent = section.querySelector<HTMLElement>(".callout-accent span");
  if (!leadImage && !lines.length) return;

  if (leadImage) {
    gsap.set(leadImage, {
      opacity: 0,
      y: 56,
      scale: 0.92,
      transformOrigin: "50% 50%",
    });
  } else {
    gsap.set(lines, {
      opacity: 0,
      y: 56,
      scale: 0.92,
      transformOrigin: "50% 50%",
    });
  }

  if (accent) {
    gsap.set(accent, {
      opacity: 0,
      y: 18,
      letterSpacing: "0.55em",
      filter: "blur(4px)",
    });
  }
  if (lead) gsap.set(lead, { force3D: true });

  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: {
      trigger: section,
      ...IN_VIEW,
    },
  });

  tl.to(leadImage ?? lines, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: leadImage ? 1.25 : 1.25,
    stagger: leadImage ? 0 : 0.18,
    ease: "power4.out",
  });

  if (accent) {
    tl.to(
      accent,
      {
        opacity: 1,
        y: 0,
        letterSpacing: "0.28em",
        filter: "blur(0px)",
        duration: 1,
        ease: "power2.out",
      },
      "-=0.55",
    );
  }

  gsap.fromTo(
    lead,
    { yPercent: 4 },
    {
      yPercent: -4,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    },
  );
}

import { gsap, prefersReducedMotion } from "./gsapClient";
import { IN_VIEW } from "./scrollTriggerDefaults";

/** Extra accents — section reveals replay; logos/footer keep scrub parallax. */
export function animateExtras(scope: HTMLElement): void {
  if (prefersReducedMotion()) return;

  const drop = scope.querySelector("#about .drop-cap");
  if (drop) {
    gsap.fromTo(
      drop,
      { scale: 0.85, opacity: 0.45, rotate: -6 },
      {
        scale: 1,
        opacity: 1,
        rotate: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#about",
          ...IN_VIEW,
        },
      },
    );
  }

  const headings = scope.querySelectorAll(".section-heading");
  headings.forEach((heading) => {
    gsap.fromTo(
      heading,
      { letterSpacing: "0.06em", opacity: 0.55 },
      {
        letterSpacing: "-0.03em",
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: heading,
          start: "top 92%",
          end: "top 55%",
          scrub: true,
        },
      },
    );
  });

  const logos = scope.querySelectorAll(
    "#clients .clients-grid li, #clients .clients-cell",
  );
  logos.forEach((logo) => {
    gsap.to(logo, {
      y: -10,
      ease: "none",
      scrollTrigger: {
        trigger: logo,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.8,
      },
    });
  });

  const footerMark = scope.querySelector(".footer-mark");
  if (footerMark) {
    gsap.fromTo(
      footerMark,
      { rotate: -12, scale: 0.85 },
      {
        rotate: 0,
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "#contact",
          start: "top 85%",
          end: "top 50%",
          scrub: true,
        },
      },
    );
  }
}

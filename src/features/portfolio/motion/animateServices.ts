import { gsap, prefersReducedMotion } from "./gsapClient";

/** Soft fade/slide-in for Services rows. */
export function animateServices(scope: HTMLElement): void {
  const section = scope.querySelector("#services");
  if (!section) return;
  const rows = section.querySelectorAll<HTMLElement>("[data-services-row]");
  if (!rows.length) return;

  if (prefersReducedMotion()) {
    gsap.set(rows, { clearProps: "transform,opacity" });
    return;
  }

  gsap.fromTo(
    rows,
    { y: 28, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.75,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "transform",
      scrollTrigger: {
        trigger: section,
        start: "top 82%",
        toggleActions: "play none none reverse",
      },
    },
  );
}

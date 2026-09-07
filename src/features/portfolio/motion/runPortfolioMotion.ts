import { gsap, registerGsap, prefersReducedMotion } from "./gsapClient";
import { animateHero } from "./animateHero";
import { animateCallout } from "./animateCallout";
import { animateSections } from "./animateSections";
import { animateCarouselScroll } from "./animateCarouselScroll";
import { animateCollectionPages } from "./animateCollectionPages";
import { animateExtras } from "./animateExtras";
import { animateServices } from "./animateServices";

export function runPortfolioMotion(root: HTMLElement): () => void {
  registerGsap();

  // Clear stale transforms on media shells only — cards may be GSAP targets.
  root.querySelectorAll<HTMLElement>(".case-media").forEach((el) => {
    el.style.removeProperty("transform");
  });

  const ctx = gsap.context(() => {
    const nav = root.querySelector(".site-nav");
    if (nav && !prefersReducedMotion()) {
      gsap.fromTo(
        nav,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.75,
          ease: "power2.out",
          delay: 0.05,
          clearProps: "transform",
        },
      );
    }

    const hero =
      root.querySelector<HTMLElement>(".hero") ??
      root.querySelector<HTMLElement>(".scroll-track");
    if (hero) animateHero(hero);

    animateCallout(root);
    animateSections(root);
    animateCarouselScroll(root);
    animateServices(root);
    animateCollectionPages(root);
    animateExtras(root);
  }, root);

  return () => ctx.revert();
}

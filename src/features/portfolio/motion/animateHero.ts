import { gsap, prefersReducedMotion } from "./gsapClient";
import { wrapWords } from "./wrapWords";
import { IN_VIEW } from "./scrollTriggerDefaults";

/** Strong hero intro; static hero tied to full in-view window. */
export function animateHero(scope: HTMLElement): void {
  const copy = scope.querySelector<HTMLElement>(".hero-copy");
  if (!copy || prefersReducedMotion()) return;

  const title = copy.querySelector<HTMLElement>("h1");
  const titleImage = copy.querySelector<HTMLElement>(".hero-headline-image");
  const kicker = copy.querySelector(".hero-kicker");
  const media = scope.querySelector(".hero-media, .scrub-video");
  const isScrub = scope.classList.contains("scroll-track");

  if (title) wrapWords(title);
  const words = title?.querySelectorAll(".motion-word") ?? [];

  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: {
      trigger: scope,
      ...IN_VIEW,
    },
  });

  if (media && !isScrub) {
    tl.fromTo(
      media,
      { opacity: 0.35 },
      { opacity: 1, duration: 1.1 },
      0,
    );
  } else if (media) {
    tl.fromTo(
      media,
      { opacity: 0.5 },
      { opacity: 1, duration: 1 },
      0,
    );
  }

  tl.fromTo(
    words,
    { yPercent: 110, opacity: 0, rotate: 2 },
    { yPercent: 0, opacity: 1, rotate: 0, duration: 0.85, stagger: 0.05 },
    0.12,
  );
  if (titleImage) {
    tl.fromTo(
      titleImage,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.85 },
      0.12,
    );
  }
  if (kicker) {
    tl.fromTo(
      kicker,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
      0.2,
    );
  }
}

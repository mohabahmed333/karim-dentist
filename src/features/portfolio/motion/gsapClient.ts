import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };

export function pauseScrollTriggers() {
  registerGsap();
  ScrollTrigger.getAll().forEach((trigger) => trigger.disable(false));
}

export function resumeScrollTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.enable());
}

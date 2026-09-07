import { gsap } from "@/features/portfolio/motion/gsapClient";

export function revealShowreelDevice(el: HTMLElement) {
  gsap.fromTo(
    el,
    { opacity: 0, y: 32, scale: 0.96, filter: "blur(8px)" },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.85,
      ease: "power3.out",
      clearProps: "filter,transform",
    },
  );
}

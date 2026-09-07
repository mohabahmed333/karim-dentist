import type { Transition, Variants } from "framer-motion";

export const chatEase = [0.22, 1, 0.36, 1] as const;

export function chatTransition(
  reduced: boolean | null,
  duration = 0.28,
): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration, ease: chatEase };
}

export const messageVariants: Variants = {
  hidden: (isUser: boolean) => ({
    opacity: 0,
    y: 10,
    x: isUser ? 12 : -12,
    scale: 0.98,
  }),
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
  },
};

export const chipListVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const chipItemVariants: Variants = {
  hidden: { opacity: 0, y: 6, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const bannerVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

export const workingVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { repeat: Infinity, repeatType: "mirror", duration: 0.9 },
  },
  exit: { opacity: 0 },
};

import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function composerSwapTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.26, ease };
}

/** Compose row exits left; recorder enters from the mic (end). */
export const composeRowVariants: Variants = {
  initial: { opacity: 0, x: -16, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.98 },
};

export const recordRowVariants: Variants = {
  initial: { opacity: 0, x: 28, scale: 0.96 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 24, scale: 0.96 },
};

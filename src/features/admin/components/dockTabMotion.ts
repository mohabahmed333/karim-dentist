import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function dockTabTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.24, ease };
}

/** `dir` +1 = toward Assist, -1 = toward WhatsApp. */
export function dockTabVariants(): Variants {
  return {
    enter: (dir: number) => ({
      x: `${28 * dir}%`,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: `${-22 * dir}%`,
      opacity: 0,
    }),
  };
}

export const DOCK_TAB_SKELETON_MS = 280;

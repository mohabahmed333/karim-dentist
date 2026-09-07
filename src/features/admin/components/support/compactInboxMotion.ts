import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** Compact bubble list ↔ thread slide (~220ms). */
export function compactPaneTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.22, ease };
}

/**
 * `dir` is +1 when opening a thread (forward) and -1 when going back to the list.
 * Multiply by -1 in RTL so motion follows reading direction.
 */
export function compactPaneVariants(rtl: boolean): Variants {
  const flip = rtl ? -1 : 1;
  return {
    enter: (dir: number) => ({
      x: `${40 * dir * flip}%`,
      opacity: 0.96,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: `${-28 * dir * flip}%`,
      opacity: 0.96,
    }),
  };
}

export const UNREAD_BADGE_POP_MS = 160;

export function unreadBadgePopTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: UNREAD_BADGE_POP_MS / 1000, ease };
}

export const unreadBadgePopAnimate = {
  scale: [1, 1.15, 0],
  opacity: [1, 1, 0],
} as const;

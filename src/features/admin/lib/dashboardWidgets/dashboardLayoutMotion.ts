import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/** Shared tween for widget reposition / col-span layout. */
export function dashboardLayoutTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration: 0.28, ease };
}

/** Toolbar / dashed slots when entering Customize. */
export function dashboardEditChromeTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0 };
  return { duration: 0.22, ease };
}

export function dashboardEditChromeVariants(
  reduced: boolean | null,
): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    };
  }
  return {
    initial: { opacity: 0, y: -6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  };
}

export function dashboardEditSlotVariants(
  reduced: boolean | null,
): Variants {
  if (reduced) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  };
}

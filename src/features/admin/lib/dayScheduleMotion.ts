import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function dayScheduleTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.28, ease };
}

/** `dir` +1 = next day, -1 = previous day. */
export function dayScheduleVariants(): Variants {
  return {
    enter: (dir: number) => ({
      x: `${22 * dir}%`,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: `${-18 * dir}%`,
      opacity: 0,
    }),
  };
}

/** Staggered appointment cards inside the day grid. */
export function dayScheduleCardVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      hidden: { opacity: 1, y: 0, scale: 1 },
      show: { opacity: 1, y: 0, scale: 1 },
    };
  }
  return {
    hidden: { opacity: 0, y: 10, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.22, ease },
    },
  };
}

export function dayScheduleCardContainerVariants(
  reduced: boolean | null,
): Variants {
  if (reduced) {
    return {
      hidden: {},
      show: {},
    };
  }
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.045, delayChildren: 0.06 },
    },
  };
}

/** Stable key for AnimatePresence when the calendar day changes. */
export function dayScheduleMotionKey(day: Date): string {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

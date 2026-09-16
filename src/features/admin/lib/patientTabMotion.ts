import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Switching a patient tab is a small, frequent move, so it is quicker than the
 * day-to-day slide: long enough to show direction, short enough that a doctor
 * tapping through four tabs never waits on it.
 */
export function patientTabTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.18, ease };
}

export function patientTabVariants(reduced: boolean | null): Variants {
  if (reduced) {
    return {
      enter: { opacity: 1, y: 0 },
      center: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
    };
  }
  return {
    enter: { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };
}

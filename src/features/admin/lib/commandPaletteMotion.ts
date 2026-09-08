import type { Transition } from "framer-motion";

export const COMMAND_LAYOUT_ID = "admin-cmdk-shell";

const ease = [0.22, 1, 0.36, 1] as const;

export function commandShellTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { type: "spring", stiffness: 420, damping: 36, mass: 0.82 };
}

export function commandBackdropTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.22, ease };
}

export function commandResultsTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.28, ease, delay: 0.08 };
}

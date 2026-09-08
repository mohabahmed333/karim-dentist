import type { Transition, Variants } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function calendarMonthTransition(reduced: boolean | null): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.32, ease };
}

export function calendarMonthTitleTransition(
  reduced: boolean | null,
): Transition {
  if (reduced) return { duration: 0.01 };
  return { duration: 0.24, ease };
}

/** `dir` +1 = next month, -1 = previous. `rtl` flips so motion follows reading direction. */
export function calendarMonthGridVariants(rtl: boolean): Variants {
  const flip = rtl ? -1 : 1;
  return {
    enter: (dir: number) => ({
      x: `${28 * dir * flip}%`,
      opacity: 0.92,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: `${-22 * dir * flip}%`,
      opacity: 0.92,
    }),
  };
}

export function calendarMonthTitleVariants(): Variants {
  return {
    enter: { opacity: 0, y: 6 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };
}

export function calendarMonthMotionKey(month: Date): string {
  const y = month.getFullYear();
  const m = String(month.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Compare calendar months only (ignore day/time). */
export function calendarMonthSlideDir(from: Date, to: Date): number {
  const a = from.getFullYear() * 12 + from.getMonth();
  const b = to.getFullYear() * 12 + to.getMonth();
  if (b === a) return 0;
  return b > a ? 1 : -1;
}

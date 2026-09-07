/** Layout tokens mirrored from archive/static/styles.css */

export const dentalSectionX = "px-[var(--page-gutter)]";
export const dentalSectionY = "py-[5.5rem]";
export const dentalSectionShell = `${dentalSectionY} ${dentalSectionX}`;

/** Tighter vertical rhythm for gallery / companion media strips. */
export const dentalSectionShellCompact = `py-12 md:py-14 ${dentalSectionX}`;

/** Full-bleed padded shell (hero + section heads). */
export const dentalFullBleed = "w-full max-w-none px-[var(--page-gutter)]";

export const dentalRadius = {
  xl: "rounded-[var(--radius-xl)]",
  lg: "rounded-[var(--radius-lg)]",
  md: "rounded-[22px]",
  sm: "rounded-[4px]",
  none: "rounded-none",
  pill: "rounded-full",
} as const;

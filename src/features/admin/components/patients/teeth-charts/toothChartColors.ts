import type { ToothVisualState } from "@/services/patient_tooth_findings/fdi";

/**
 * One palette for every tooth chart — odontogram, arch, circles and grid.
 *
 * All of it derives from `--admin-primary`, which the clinic sets from the DB
 * at runtime, so a selected tooth is the clinic's colour rather than a fixed
 * swatch. `color-mix` against `transparent` keeps a single hue across the
 * states and lets whatever the chart sits on show through, which is what makes
 * the same values work on the light and dark admin canvas.
 *
 * Charts differ in how much tint they can carry: an outlined tooth has groove
 * lines to stay legible under the fill, a plain circle does not. Hence the two
 * fill scales rather than one.
 */

/** Tints for charts whose shape has interior detail to preserve (odontogram). */
export const TOOTH_FILL: Record<ToothVisualState, string> = {
  unmarked: "color-mix(in srgb, var(--admin-primary) 14%, transparent)",
  "has-comment": "color-mix(in srgb, var(--admin-primary) 18%, transparent)",
  active: "color-mix(in srgb, var(--admin-primary) 34%, transparent)",
};

/** Tints for flat shapes (arch ellipses, circles), which can take more colour. */
export const TOOTH_FILL_SOLID: Record<ToothVisualState, string> = {
  unmarked: "var(--admin-panel)",
  "has-comment": "color-mix(in srgb, var(--admin-primary) 22%, transparent)",
  active: "var(--admin-primary)",
};

export const TOOTH_STROKE: Record<ToothVisualState, string> = {
  unmarked: "var(--admin-border)",
  "has-comment": "color-mix(in srgb, var(--admin-primary) 55%, transparent)",
  active: "var(--admin-primary)",
};

/** Outline for a tooth the pointer is over but which carries no state yet. */
export const TOOTH_HOVER_STROKE =
  "color-mix(in srgb, var(--admin-primary) 45%, transparent)";

/** Wash for that same hover, below the "has a comment" tint. */
export const TOOTH_HOVER_FILL =
  "color-mix(in srgb, var(--admin-primary) 12%, transparent)";

/**
 * Label colour for a tooth filled with `TOOTH_FILL_SOLID.active`.
 *
 * White, not `--admin-primary-contrast`: that token is the primary re-tinted to
 * read *against the canvas*, so on a primary fill it would be primary on
 * primary. White on the accent is what the rest of the admin does — the tabs,
 * the style picker, the "Now" chip.
 */
export const TOOTH_ACTIVE_LABEL = "#ffffff";

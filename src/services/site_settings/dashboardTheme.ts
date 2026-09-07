import { z } from "zod";

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color like #5E6AD2");

export const dashboardThemeSchema = z.object({
  dashboard_primary_color: hexColorSchema,
  dashboard_secondary_color: hexColorSchema,
});

export type DashboardThemeValues = z.infer<typeof dashboardThemeSchema>;

export const DEFAULT_DASHBOARD_PRIMARY = "#5E6AD2";
export const DEFAULT_DASHBOARD_SECONDARY = "#3B82F6";

export function normalizeHexColor(value: string | null | undefined, fallback: string) {
  const raw = (value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return fallback;
}

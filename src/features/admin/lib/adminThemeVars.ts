import type { CSSProperties } from "react";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";

export const ADMIN_VAR_KEYS = [
  "--admin-primary",
  "--admin-secondary",
  "--admin-canvas",
  "--admin-panel",
  "--admin-border",
  "--admin-text",
  "--admin-muted",
  "--admin-hover",
  "--admin-active",
] as const;

export type AdminThemeVars = Record<(typeof ADMIN_VAR_KEYS)[number], string>;

export const FALLBACK_ADMIN_THEME: AdminThemeVars = {
  "--admin-primary": "#5e6ad2",
  "--admin-secondary": "#3b82f6",
  "--admin-canvas": "#f7f8f8",
  "--admin-panel": "#ffffff",
  "--admin-border": "#e6e6e6",
  "--admin-text": "#1a1a1a",
  "--admin-muted": "#6b6f76",
  "--admin-hover": "#eeeff1",
  "--admin-active": "#eceef9",
};

/** Read live admin CSS vars from `.admin-shell` (portals need this). */
export function readAdminThemeVars(): AdminThemeVars {
  if (typeof document === "undefined") return FALLBACK_ADMIN_THEME;
  const shell = document.querySelector(".admin-shell");
  if (!shell) return FALLBACK_ADMIN_THEME;
  const cs = getComputedStyle(shell);
  const next = { ...FALLBACK_ADMIN_THEME };
  for (const key of ADMIN_VAR_KEYS) {
    const value = cs.getPropertyValue(key).trim();
    if (value) next[key] = value;
  }
  return next;
}

/** Portal-safe style bag: admin tokens + shadcn primary aliases. */
export function adminThemeStyle(
  vars: AdminThemeVars = readAdminThemeVars(),
  options: { surface?: boolean } = {},
): CSSProperties {
  const { surface = true } = options;
  return {
    ...vars,
    ...(surface
      ? { backgroundColor: vars["--admin-panel"] }
      : { backgroundColor: "transparent" }),
    color: vars["--admin-text"],
    "--primary": vars["--admin-primary"],
    "--primary-foreground": "#ffffff",
    "--ring": vars["--admin-primary"],
  } as CSSProperties;
}

export { ADMIN_THEME_EVENT };

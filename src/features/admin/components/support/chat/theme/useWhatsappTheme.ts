"use client";

import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";
import { WA_THEME_PRESETS } from "./waThemeVars";

/**
 * WhatsApp chat window theme, backed by the shared admin UI store, plus the
 * site-wide admin dark mode toggle. The stored preference is only
 * "light" | "classic" — dark isn't user-selectable here; it's forced
 * whenever admin dark mode is on, and the chat reverts to the stored
 * preference the moment it's turned off.
 */
export function useWhatsappTheme() {
  const preference = useAdminUiStore((state) => state.waThemePreference);
  const setTheme = useAdminUiStore((state) => state.setWaThemePreference);
  const siteDarkMode = useAdminUiStore((state) => state.darkMode);
  const ready = useAdminUiStore((state) => state.hasHydrated);

  const themeId = siteDarkMode ? "dark" : preference;

  return {
    themeId,
    preference,
    siteDarkMode,
    setTheme,
    ready,
    vars: WA_THEME_PRESETS[themeId],
  };
}

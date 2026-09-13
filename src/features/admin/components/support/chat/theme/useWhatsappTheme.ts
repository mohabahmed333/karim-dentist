"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ADMIN_DARK_MODE_EVENT,
  readAdminDarkMode,
} from "@/features/admin/hooks/useAdminDarkMode";
import { WA_THEME_PRESETS, type WaThemePreference } from "./waThemeVars";

const STORAGE_KEY = "wa-chat-theme";
/** Fired on every change so sibling mounts (chat column + inbox list) stay in sync. */
const WA_THEME_EVENT = "wa-chat-theme-change";

function isWaThemePreference(value: string | null): value is WaThemePreference {
  return value === "light" || value === "classic";
}

export function readWaTheme(): WaThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isWaThemePreference(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function writeWaTheme(id: WaThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent<WaThemePreference>(WA_THEME_EVENT, { detail: id }),
  );
}

/**
 * WhatsApp chat window theme from localStorage, plus the site-wide admin dark
 * mode toggle. The stored preference is only "light" | "classic" — dark isn't
 * user-selectable here; it's forced whenever admin dark mode is on, and the
 * chat reverts to the stored preference the moment it's turned off.
 */
export function useWhatsappTheme() {
  const [preference, setPreference] = useState<WaThemePreference>("light");
  const [siteDarkMode, setSiteDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreference(readWaTheme());
    setSiteDarkMode(readAdminDarkMode());
    setReady(true);
    function onThemeChange(event: Event) {
      setPreference((event as CustomEvent<WaThemePreference>).detail);
    }
    function onDarkModeChange(event: Event) {
      setSiteDarkMode((event as CustomEvent<boolean>).detail);
    }
    window.addEventListener(WA_THEME_EVENT, onThemeChange);
    window.addEventListener(ADMIN_DARK_MODE_EVENT, onDarkModeChange);
    return () => {
      window.removeEventListener(WA_THEME_EVENT, onThemeChange);
      window.removeEventListener(ADMIN_DARK_MODE_EVENT, onDarkModeChange);
    };
  }, []);

  const setTheme = useCallback((id: WaThemePreference) => {
    setPreference(id);
    writeWaTheme(id);
  }, []);

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

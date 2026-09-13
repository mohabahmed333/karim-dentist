"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin-dark-mode";
/** Fired on every change so other mounts (e.g. the WhatsApp chat theme) stay in sync. */
export const ADMIN_DARK_MODE_EVENT = "admin-dark-mode-change";

export function readAdminDarkMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminDarkMode(darkMode: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, darkMode ? "1" : "0");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent<boolean>(ADMIN_DARK_MODE_EVENT, { detail: darkMode }),
  );
}

/**
 * Site-wide admin dark mode preference from localStorage.
 * Defaults to `false` (light) until the stored value loads in an effect, so
 * SSR markup and first client render match — same tradeoff as
 * useAdminSidebarCollapse. Other mounts (WhatsApp chat theme) sync via
 * ADMIN_DARK_MODE_EVENT.
 */
export function useAdminDarkMode() {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDarkMode(readAdminDarkMode());
    setReady(true);
    function onChange(event: Event) {
      setDarkMode((event as CustomEvent<boolean>).detail);
    }
    window.addEventListener(ADMIN_DARK_MODE_EVENT, onChange);
    return () => window.removeEventListener(ADMIN_DARK_MODE_EVENT, onChange);
  }, []);

  // Not a functional updater: writeAdminDarkMode dispatches a window event that
  // synchronously triggers other components' setState (e.g. the WhatsApp chat
  // theme). Calling that from inside a setState updater risks React invoking it
  // during another component's render phase, which React (correctly) rejects.
  const toggle = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    writeAdminDarkMode(next);
  }, [darkMode]);

  return { darkMode, toggle, ready };
}

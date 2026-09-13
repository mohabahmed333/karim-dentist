"use client";

import { useAdminUiStore } from "@/features/admin/stores/adminUiStore";

/** Site-wide admin dark mode preference, backed by the shared admin UI store. */
export function useAdminDarkMode() {
  const darkMode = useAdminUiStore((state) => state.darkMode);
  const toggle = useAdminUiStore((state) => state.toggleDarkMode);
  const ready = useAdminUiStore((state) => state.hasHydrated);

  return { darkMode, toggle, ready };
}

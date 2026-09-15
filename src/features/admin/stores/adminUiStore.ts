"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { WaThemePreference } from "@/features/admin/components/support/chat/theme/waThemeVars";

/** Pre-Zustand per-key localStorage names — read once as a fallback so migrating
 *  to this store doesn't reset a returning user's saved preferences. */
const LEGACY_KEYS = {
  darkMode: "admin-dark-mode",
  sidebarCollapsed: "admin-sidebar-collapsed",
  waThemePreference: "wa-chat-theme",
} as const;

const STORE_KEY = "admin-ui-store";

type LegacyAdminUiState = {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  waThemePreference: WaThemePreference;
};

/** Exported for tests — reads the old per-key values from a storage-like object. */
export function readLegacyAdminUiState(storage: Pick<Storage, "getItem">): LegacyAdminUiState {
  const waStored = storage.getItem(LEGACY_KEYS.waThemePreference);
  return {
    darkMode: storage.getItem(LEGACY_KEYS.darkMode) === "1",
    sidebarCollapsed: storage.getItem(LEGACY_KEYS.sidebarCollapsed) === "1",
    waThemePreference: waStored === "classic" ? "classic" : "light",
  };
}

const migratingStorage: StateStorage = {
  getItem: (name) => {
    try {
      const existing = localStorage.getItem(name);
      if (existing) return existing;
      // First run after switching to the store — seed from the old individual
      // keys instead of silently resetting a returning user's preferences.
      return JSON.stringify({ state: readLegacyAdminUiState(localStorage), version: 0 });
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

type AdminUiState = LegacyAdminUiState & {
  /** False until the persisted value has loaded client-side — matches the old
   *  "SSR-safe default, then hydrate" hooks so nothing flashes wrong-then-right. */
  hasHydrated: boolean;
  /** Nav groups/sub-groups the sidebar last had manually open, so a refresh
   *  on the same page restores them instead of collapsing back to just
   *  whatever the current page auto-opens. */
  openGroupIds: string[];
  /** The floating team-notes panel's last position/size/collapsed state —
   *  a per-browser UI preference, separate from the notes' shared DB content. */
  notesPanelPosition: { x: number; y: number };
  notesPanelSize: { width: number; height: number };
  notesPanelMinimized: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setWaThemePreference: (id: WaThemePreference) => void;
  setOpenGroupIds: (ids: string[]) => void;
  setNotesPanelPosition: (pos: { x: number; y: number }) => void;
  setNotesPanelSize: (size: { width: number; height: number }) => void;
  setNotesPanelMinimized: (minimized: boolean) => void;
  hydrateComplete: () => void;
};

/**
 * Single shared store for the admin chrome's cross-component UI preferences
 * (dark mode, sidebar collapse, WhatsApp chat theme). Replaces the previous
 * per-hook localStorage + window CustomEvent bus — every mount reading from
 * this store re-renders on its own when another mount calls an action, with
 * no manual event wiring.
 */
export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarCollapsed: false,
      waThemePreference: "light",
      hasHydrated: false,
      openGroupIds: [],
      notesPanelPosition: { x: 24, y: 96 },
      notesPanelSize: { width: 280, height: 360 },
      notesPanelMinimized: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setWaThemePreference: (id) => set({ waThemePreference: id }),
      setOpenGroupIds: (ids) => set({ openGroupIds: ids }),
      setNotesPanelPosition: (pos) => set({ notesPanelPosition: pos }),
      setNotesPanelSize: (size) => set({ notesPanelSize: size }),
      setNotesPanelMinimized: (minimized) => set({ notesPanelMinimized: minimized }),
      hydrateComplete: () => set({ hasHydrated: true }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => migratingStorage),
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        waThemePreference: state.waThemePreference,
        openGroupIds: state.openGroupIds,
        notesPanelPosition: state.notesPanelPosition,
        notesPanelSize: state.notesPanelSize,
        notesPanelMinimized: state.notesPanelMinimized,
      }),
      onRehydrateStorage: () => (state) => {
        state?.hydrateComplete();
      },
    },
  ),
);

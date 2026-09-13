import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readLegacyAdminUiState } from "./adminUiStore.ts";

describe("admin UI store legacy migration", () => {
  it("defaults to light/expanded when nothing was ever saved", () => {
    const store = new Map<string, string>();
    const state = readLegacyAdminUiState({ getItem: (k) => store.get(k) ?? null });
    assert.deepEqual(state, {
      darkMode: false,
      sidebarCollapsed: false,
      waThemePreference: "light",
    });
  });

  it("reads a returning user's old per-key values", () => {
    const store = new Map<string, string>([
      ["admin-dark-mode", "1"],
      ["admin-sidebar-collapsed", "1"],
      ["wa-chat-theme", "classic"],
    ]);
    const state = readLegacyAdminUiState({ getItem: (k) => store.get(k) ?? null });
    assert.deepEqual(state, {
      darkMode: true,
      sidebarCollapsed: true,
      waThemePreference: "classic",
    });
  });

  it("falls back to light for an unrecognized wa theme value", () => {
    const store = new Map<string, string>([["wa-chat-theme", "dark"]]);
    const state = readLegacyAdminUiState({ getItem: (k) => store.get(k) ?? null });
    assert.equal(state.waThemePreference, "light");
  });
});

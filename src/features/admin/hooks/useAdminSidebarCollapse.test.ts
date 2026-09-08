import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readAdminSidebarCollapsed,
  writeAdminSidebarCollapsed,
} from "./useAdminSidebarCollapse.ts";

describe("admin sidebar collapse storage", () => {
  it("reads collapsed when storage is 1", () => {
    const store = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
    });
    try {
      assert.equal(readAdminSidebarCollapsed(), false);
      writeAdminSidebarCollapsed(true);
      assert.equal(readAdminSidebarCollapsed(), true);
      writeAdminSidebarCollapsed(false);
      assert.equal(readAdminSidebarCollapsed(), false);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: original,
      });
    }
  });
});

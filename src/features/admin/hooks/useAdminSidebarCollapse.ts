"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function readAdminSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Sidebar collapse preference from localStorage.
 * `ready` is false until the stored value is applied — callers must not
 * paint the open sidebar before that, or reload flashes open→closed.
 */
export function useAdminSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsed(readAdminSidebarCollapsed());
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeAdminSidebarCollapsed(next);
      return next;
    });
  }, []);

  return { collapsed, toggle, ready };
}

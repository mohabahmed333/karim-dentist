"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminChatLayout = "float" | "dock";

const LAYOUT_KEY = "admin-chat-layout";
const COLLAPSE_KEY = "admin-chat-dock-collapsed";

export function useAdminChatLayout() {
  const [layout, setLayoutState] = useState<AdminChatLayout>("float");
  const [dockCollapsed, setDockCollapsedState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_KEY);
      if (stored === "dock" || stored === "float") setLayoutState(stored);
      setDockCollapsedState(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setLayout = useCallback((next: AdminChatLayout) => {
    setLayoutState(next);
    try {
      localStorage.setItem(LAYOUT_KEY, next);
    } catch {
      /* ignore */
    }
    if (next === "dock") {
      setDockCollapsedState(false);
      try {
        localStorage.setItem(COLLAPSE_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutState((prev) => {
      const next: AdminChatLayout = prev === "float" ? "dock" : "float";
      try {
        localStorage.setItem(LAYOUT_KEY, next);
      } catch {
        /* ignore */
      }
      if (next === "dock") {
        setDockCollapsedState(false);
        try {
          localStorage.setItem(COLLAPSE_KEY, "0");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, []);

  const setDockCollapsed = useCallback((next: boolean) => {
    setDockCollapsedState(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDockCollapsed = useCallback(() => {
    setDockCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const expandDock = useCallback(() => {
    setDockCollapsed(false);
  }, [setDockCollapsed]);

  return {
    layout,
    setLayout,
    toggleLayout,
    dockCollapsed,
    setDockCollapsed,
    toggleDockCollapsed,
    expandDock,
    ready,
  };
}

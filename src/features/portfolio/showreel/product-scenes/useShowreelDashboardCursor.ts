"use client";

import { useEffect } from "react";
import { SHOWREEL_DASHBOARD_CURSOR_STEPS } from "./showreelCursorTimeline";
import {
  SHOWREEL_NAVIGATE_EVENT,
  type ShowreelNavigateDetail,
} from "./showreelAdminEvents";
import { useShowreelCursorScript } from "./useShowreelCursorScript";

export { useShowreelCursorScript };

/** @deprecated use useShowreelCursorScript */
export function useShowreelDashboardCursor(active: boolean, runId = 0) {
  return useShowreelCursorScript(
    active,
    runId,
    SHOWREEL_DASHBOARD_CURSOR_STEPS,
  );
}

/** Block Next.js navigation to /admin/support; switch showreel page instead. */
export function useShowreelBlockAdminNav(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href="/admin/support"]');
      if (!link) return;
      event.preventDefault();
      window.dispatchEvent(
        new CustomEvent(SHOWREEL_NAVIGATE_EVENT, {
          detail: {
            href: "/admin/support",
            title: "Front desk",
            id: "support",
            kind: "page",
          } satisfies ShowreelNavigateDetail,
        }),
      );
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [enabled]);
}

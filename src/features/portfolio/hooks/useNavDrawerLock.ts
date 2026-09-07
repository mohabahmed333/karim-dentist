"use client";

import { useEffect } from "react";
import {
  freezeSiteShellScroll,
  lockDrawerScroll,
  restoreDrawerScroll,
} from "../lib/drawerScrollLock";

/** Body classes + scroll lock while the nav drawer is open. */
export function useNavDrawerLock(open: boolean) {
  useEffect(() => {
    const durationMs = 520;
    if (open) {
      lockDrawerScroll();
      document.body.classList.remove("nav-drawer-closing");
      document.body.classList.add("nav-drawer-open");
      freezeSiteShellScroll();
      return;
    }
    if (!document.body.classList.contains("nav-drawer-open")) return;
    document.body.classList.remove("nav-drawer-open");
    document.body.classList.add("nav-drawer-closing");
    const timer = window.setTimeout(() => {
      document.body.classList.remove("nav-drawer-closing");
      restoreDrawerScroll();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("nav-drawer-open");
      document.body.classList.remove("nav-drawer-closing");
      document.documentElement.style.removeProperty("--drawer-scroll-y");
    };
  }, []);
}

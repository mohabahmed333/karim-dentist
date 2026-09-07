"use client";

import { useEffect } from "react";
import { applyScrollDirectionHide } from "./scrollDirectionHide";

export function useScrollDirectionHide(elementId: string, paused = false) {
  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el || el.closest(".customize-preview-canvas")) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const target = document.getElementById(elementId);
      if (!target) {
        ticking = false;
        return;
      }

      const drawerOpen = document.body.classList.contains("nav-drawer-open");
      lastY = applyScrollDirectionHide(
        target,
        window.scrollY,
        lastY,
        paused || drawerOpen,
      );
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    el.classList.remove("is-scroll-hidden");
    el.style.removeProperty("transform");
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      el.classList.remove("is-scroll-hidden");
      el.style.removeProperty("transform");
    };
  }, [elementId, paused]);
}

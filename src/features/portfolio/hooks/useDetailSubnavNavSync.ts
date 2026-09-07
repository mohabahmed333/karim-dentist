"use client";

import { useEffect } from "react";

/** Pin subnav to top when the main nav scroll-hides (works when portaled to body). */
export function useDetailSubnavNavSync(subnavId: string, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const nav = document.getElementById("site-nav");
    const subnav = document.getElementById(subnavId);
    if (!nav || !subnav || subnav.closest(".customize-preview-canvas")) return;

    const sync = () => {
      subnav.classList.toggle(
        "is-nav-hidden-companion",
        nav.classList.contains("is-scroll-hidden"),
      );
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(nav, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [subnavId, enabled]);
}

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { openContactPopup } from "../lib/contactPopupBus";
import { scrollToElement } from "../lib/drawerScrollLock";
import { stripLocale } from "@/lib/i18n/localePath";

/** Hash routing: contact popup on any page; homepage section scroll on `/`. */
export function HomeHashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;

      if (id === "contact-popup") {
        openContactPopup();
        return;
      }

      // "/" and "/ar" are both home — the section IDs only exist there.
      if (stripLocale(pathname).path !== "/") return;

      scrollToElement(id);
    };

    const frame = window.requestAnimationFrame(scrollToHash);
    const timer = window.setTimeout(scrollToHash, 120);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}

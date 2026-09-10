"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { stripLocale } from "@/lib/i18n/localePath";

function scrollKey(pathname: string) {
  return `scroll-y:${pathname}`;
}

function readScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function writeScroll(top: number) {
  window.scrollTo({ top, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

export function RouteScrollToTop() {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const persist = () => {
      try {
        sessionStorage.setItem(scrollKey(pathname), String(readScrollY()));
      } catch {
        /* private mode / quota */
      }
    };

    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);
    return () => {
      persist();
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("beforeunload", persist);
    };
  }, [pathname]);

  useEffect(() => {
    // "/" and "/ar" are both home for this check — landing on either with
    // a hash means HomeHashScroll is about to handle it, not us.
    if (stripLocale(pathname).path === "/" && window.location.hash) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      let saved = 0;
      try {
        saved = Number(sessionStorage.getItem(scrollKey(pathname)) || 0);
      } catch {
        saved = 0;
      }
      if (saved <= 0) return;
      const restore = () => writeScroll(saved);
      restore();
      requestAnimationFrame(restore);
      const a = window.setTimeout(restore, 120);
      const b = window.setTimeout(restore, 400);
      return () => {
        window.clearTimeout(a);
        window.clearTimeout(b);
      };
    }

    writeScroll(0);
  }, [pathname]);

  return null;
}

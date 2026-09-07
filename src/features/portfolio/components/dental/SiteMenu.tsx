"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "@/lib/i18n";
import { DentalPrimaryNav } from "./DentalPrimaryNav";
import { cn } from "@/lib/utils";

type SiteMenuProps = {
  open: boolean;
  onClose: () => void;
  stickyVisible?: boolean;
  hiddenSections?: string[];
  location?: "home" | "inner";
  contained?: boolean;
};

function usesPushMenu() {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function SiteMenu({
  open,
  onClose,
  stickyVisible = false,
  hiddenSections = [],
  location = "home",
  contained = false,
}: SiteMenuProps) {
  const t = useTranslations();
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (contained) return;

    const root = document.documentElement;
    const clear = () => {
      root.style.removeProperty("--menu-top");
      root.style.removeProperty("--menu-push");
      document.body.classList.remove("menu-open");
    };

    if (!open) {
      clear();
      return clear;
    }

    document.body.classList.add("menu-open");

    const updateLayout = () => {
      const menu = menuRef.current;
      if (!menu || menu.hidden) return;

      if (usesPushMenu()) {
        root.style.removeProperty("--menu-top");
        root.style.setProperty("--menu-push", `${menu.offsetHeight}px`);
        return;
      }

      root.style.removeProperty("--menu-push");
      const sticky = document.getElementById("site-header");
      const topbar = document.querySelector<HTMLElement>("[data-hero-topbar]");
      const anchor = stickyVisible && sticky ? sticky : topbar;
      if (anchor) {
        root.style.setProperty(
          "--menu-top",
          `${Math.ceil(anchor.getBoundingClientRect().bottom)}px`,
        );
      } else {
        root.style.setProperty("--menu-top", "0px");
      }
    };

    if (usesPushMenu() && window.scrollY > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    updateLayout();
    const frame = requestAnimationFrame(updateLayout);
    window.addEventListener("resize", updateLayout);
    window.addEventListener("scroll", updateLayout, { passive: true });

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-menu-toggle]")) return;
      if (target.closest("#site-menu")) return;
      onCloseRef.current();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("scroll", updateLayout);
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
      clear();
    };
  }, [open, stickyVisible, contained]);

  return (
    <div
      ref={menuRef}
      id="site-menu"
      hidden={!open}
      className={cn(
        "site-menu border-b border-[#e6e8ec] bg-white/98 px-[var(--page-gutter)] py-4 shadow-[0_12px_32px_rgba(15,39,68,0.1)] backdrop-blur-[12px]",
        contained
          ? "absolute inset-x-0 top-0 z-20"
          : "fixed inset-x-0 top-[var(--menu-top,0px)] z-[45] max-h-[calc(100dvh-var(--menu-top,0px))] overflow-y-auto md:top-[var(--site-header-height,0px)] md:z-[35] md:max-h-none md:overflow-visible md:border-0 md:bg-transparent md:shadow-none md:backdrop-blur-none",
      )}
    >
      <DentalPrimaryNav
        hiddenSections={hiddenSections}
        location={location}
        onNavigate={onClose}
        className="site-menu-nav flex flex-col gap-0 text-[#0f2744] md:flex-row md:flex-wrap md:items-center md:gap-x-6 md:gap-y-3"
      />
      <p className="sr-only">{t("navPrimary")}</p>
    </div>
  );
}

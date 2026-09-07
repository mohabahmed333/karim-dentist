"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Brand } from "./Brand";
import { DentalPrimaryNav } from "./DentalPrimaryNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MenuToggle } from "./MenuToggle";
import { SiteMenu } from "./SiteMenu";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  brand: string;
  brandLogo?: string | null;
  hiddenSections?: string[];
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  /** Always show the bar (inner pages). Homepage keeps scroll-reveal. */
  pinned?: boolean;
  location?: "home" | "inner";
  /** Keep header inside a scroll parent (Customize preview) instead of the viewport. */
  contained?: boolean;
};

export function SiteHeader({
  brand,
  brandLogo,
  hiddenSections = [],
  menuOpen: menuOpenProp,
  onMenuOpenChange,
  pinned = false,
  location = "home",
  contained = false,
}: SiteHeaderProps) {
  const t = useTranslations();
  const [internalOpen, setInternalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const controlled = typeof menuOpenProp === "boolean";
  const menuOpen = controlled ? menuOpenProp : internalOpen;
  const visible = pinned || scrolled;

  function setMenuOpen(next: boolean) {
    if (controlled) onMenuOpenChange?.(next);
    else setInternalOpen(next);
  }

  useEffect(() => {
    if (pinned) return;
    const scrollRoot = contained
      ? document.querySelector<HTMLElement>("[data-customize-preview-scroll]")
      : null;
    const onScroll = () => {
      const y = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
      setScrolled(y > 120);
    };
    onScroll();
    const target: HTMLElement | Window = scrollRoot ?? window;
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [pinned, contained]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--site-header-height",
      visible ? "72px" : "0px",
    );
  }, [visible]);

  return (
    <>
      <header
        id="site-header"
        className={cn(
          "bg-white/90 backdrop-blur-md transition-all duration-300",
          contained
            ? visible
              ? "sticky inset-x-0 top-0 z-10"
              : "absolute inset-x-0 top-0 z-10"
            : "fixed inset-x-0 top-0 z-50",
          pinned ? "border-b border-[#e6e8ec]" : "border-b border-transparent",
          visible
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none",
        )}
        aria-hidden={!visible}
      >
        <div className="flex w-full items-center justify-between gap-4 px-[var(--page-gutter)] py-3">
          <Brand
            name={brand}
            logoUrl={brandLogo}
            href={pinned ? "/" : "#home"}
            ariaLabel={t("brandAria")}
          />
          <div className="flex items-center gap-3">
            <DentalPrimaryNav
              hiddenSections={hiddenSections}
              omitSlider
              location={location}
              className="hidden items-center gap-6 text-sm font-semibold text-[#0f2744] lg:flex"
            />
            <LanguageSwitcher />
            <MenuToggle
              expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              ariaLabel={menuOpen ? t("menuCloseAria") : t("menuOpenAria")}
              className="lg:hidden"
            />
          </div>
        </div>
      </header>
      <SiteMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        stickyVisible={visible}
        hiddenSections={hiddenSections}
        location={location}
        contained={contained}
      />
    </>
  );
}

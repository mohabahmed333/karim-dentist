"use client";

import { useLocale, useTranslations } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/localePath";
import {
  HOMEPAGE_SECTION_NAV,
  visibleHomepageNavKeys,
} from "@/features/portfolio/lib/homepageSectionNav";
import type { HomepageSectionKey } from "@/features/portfolio/lib/homepageSectionOrder";

type Props = {
  hiddenSections?: string[];
  omitSlider?: boolean;
  /** Inner pages need /#about so hashes resolve on the homepage. */
  location?: "home" | "inner";
  className?: string;
  onNavigate?: () => void;
};

const NAV_LABEL: Record<HomepageSectionKey, "navAbout" | "navServices" | "navGallery" | "navMore" | "navCaseStudies" | "navProjects" | "navFaq" | "navContact"> = {
  about: "navAbout",
  services: "navServices",
  gallery: "navGallery",
  slider: "navMore",
  "case-studies": "navCaseStudies",
  featured: "navProjects",
  faq: "navFaq",
  contact: "navContact",
};

export function DentalPrimaryNav({
  hiddenSections = [],
  omitSlider = false,
  location = "home",
  className,
  onNavigate,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const navKeys = visibleHomepageNavKeys(hiddenSections).filter(
    (key) => !(omitSlider && key === "slider"),
  );

  function hrefFor(key: HomepageSectionKey): string {
    if (location === "inner") {
      if (key === "case-studies") return localePath(locale, "/case-studies");
      if (key === "featured") return localePath(locale, "/featured");
      // e.g. "/#about" — a homepage anchor reached from an inner page.
      return localePath(locale, `/${HOMEPAGE_SECTION_NAV[key].href}`);
    }
    // In-page hash on the homepage itself — no locale prefix, it navigates
    // within the current URL.
    return HOMEPAGE_SECTION_NAV[key].href;
  }

  return (
    <nav className={className} aria-label={t("navPrimary")}>
      {navKeys.map((key) => (
        <a key={key} href={hrefFor(key)} onClick={onNavigate}>
          {t(NAV_LABEL[key])}
        </a>
      ))}
    </nav>
  );
}

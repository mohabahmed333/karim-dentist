"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { localizedCms, pickLocalized, useLocale, useTranslations } from "@/lib/i18n";
import {
  HOMEPAGE_SECTION_NAV,
  isHomepageNavHrefVisible,
  isSitePageSectionVisible,
} from "@/features/portfolio/lib/homepageSectionNav";
import { resolveFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { Brand } from "./Brand";
import { DentalButton } from "./DentalButton";

type DentalSiteFooterProps = {
  brand: string;
  brandLogo?: string | null;
  footerLinks: Tables<"footer_links">[];
  settings?: Tables<"site_settings"> | null;
  hiddenSections?: string[];
};

export function DentalSiteFooter({
  brand,
  brandLogo,
  footerLinks,
  settings,
  hiddenSections = [],
}: DentalSiteFooterProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const phone = settings?.contact_phone || "+20 111 192 2252";
  const address = settings?.contact_address || t("contactAddress");
  const tagline = localizedCms(
    locale,
    settings?.footer_tagline,
    settings?.footer_tagline_ar,
    t("footerTagline"),
  );

  const baseLinks = (
    footerLinks.length > 0
      ? footerLinks
      : ([
          { id: "1", label: t("navAbout"), label_ar: "", href: "#about" },
          { id: "2", label: t("navServices"), label_ar: "", href: "#services" },
          { id: "3", label: t("navGallery"), label_ar: "", href: "#gallery" },
          { id: "4", label: t("navMore"), label_ar: "", href: "#more-images" },
          { id: "5", label: t("navContact"), label_ar: "", href: "#contact" },
        ] as Tables<"footer_links">[])
  ).filter((link) =>
    isHomepageNavHrefVisible(resolveFooterLink(link).href, hiddenSections),
  );

  const existingHrefs = new Set(
    baseLinks.map((link) => resolveFooterLink(link).href),
  );
  const extras = (
    ["case-studies", "featured"] as const
  )
    .filter((key) => isSitePageSectionVisible(key, hiddenSections))
    .filter((key) => {
      const href = HOMEPAGE_SECTION_NAV[key].href;
      return !existingHrefs.has(href) && !existingHrefs.has(`/${href}`);
    })
    .map((key) => ({
      id: `page-${key}`,
      label: key === "case-studies" ? t("navCaseStudies") : t("navProjects"),
      href: HOMEPAGE_SECTION_NAV[key].href,
    }));

  const links = [
    ...baseLinks.map((link) => {
      const resolved = resolveFooterLink(link);
      const hrefKey =
        resolved.href === "#about" || resolved.href.endsWith("/#about")
          ? t("navAbout")
          : resolved.href === "#services" || resolved.href.endsWith("/#services")
            ? t("navServices")
            : resolved.href === "#gallery" || resolved.href.endsWith("/#gallery")
              ? t("navGallery")
              : resolved.href === "#more-images" ||
                  resolved.href.endsWith("/#more-images")
                ? t("navMore")
                : resolved.href === "#contact" || resolved.href.endsWith("/#contact")
                  ? t("navContact")
                  : resolved.label;
      return {
        id: link.id,
        label: localizedCms(locale, link.label, link.label_ar, hrefKey),
        href: resolved.href,
      };
    }),
    ...extras,
  ];

  return (
    <footer className="border-t border-[#e6e8ec] bg-white py-16" data-customize-section="footer">
      <div className="grid w-full gap-10 px-[var(--page-gutter)] lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Brand name={brand} logoUrl={brandLogo} ariaLabel={t("brandAria")} />
          <p
            className="mt-4 max-w-md text-sm leading-relaxed text-[#6b7280]"
            data-customize-field="footer_tagline"
          >
            {tagline}
          </p>
        </div>

        <nav aria-label={t("footerNavAria")} className="flex flex-col gap-3 text-sm text-[#0f2744]">
          {links.map((link) => (
            <a key={link.id} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="space-y-3 text-sm text-[#6b7280]">
          <p className="text-sm text-[#6b7280]" data-customize-field="contact_address">
            {address}
          </p>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="block text-[#0f2744]">
            {phone}
          </a>
          <div className="flex flex-wrap gap-3 pt-2">
            <DentalButton href={`tel:${phone.replace(/\s/g, "")}`} size="sm">
              {t("contactCall")}
            </DentalButton>
            <DentalButton
              href={`https://wa.me/${settings?.contact_whatsapp || "201111922252"}`}
              variant="ghost"
              size="sm"
            >
              {t("contactWhatsapp")}
            </DentalButton>
          </div>
        </div>
      </div>

      <div className="mt-10 w-full border-t border-[#e6e8ec] px-[var(--page-gutter)] pt-6">
        <p className="text-sm text-[#6b7280]">{t("footerText")}</p>
      </div>
    </footer>
  );
}

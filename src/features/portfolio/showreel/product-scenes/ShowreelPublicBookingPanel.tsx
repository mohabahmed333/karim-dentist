"use client";

import { useLocale, useTranslations } from "@/lib/i18n";
import type { PortfolioData } from "@/services/portfolio";
import { DentalContactSection } from "@/features/portfolio/components/dental/DentalContactSection";
import { resolveDentalSectionCopy } from "@/features/portfolio/lib/homepageSectionCopy";

type Props = {
  siteData: PortfolioData;
};

/** Real contact reservation section (API slots + clinic card) for site-to-chat. */
export function ShowreelPublicBookingPanel({ siteData }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const copy = resolveDentalSectionCopy(
    siteData.settings,
    {
      aboutLabel: t("aboutLabel"),
      solutionsTitle: t("solutionsTitle"),
      solutionsSide: t("solutionsSide"),
      servicesLabel: t("servicesLabel"),
      servicesHeading: t("servicesHeading"),
      servicesIntro: t("servicesIntro"),
      galleryLabel: t("galleryLabel"),
      galleryHeading: t("galleryHeading"),
      galleryIntro: t("galleryIntro"),
      sliderLabel: t("sliderLabel"),
      sliderHeading: t("sliderHeading"),
      sliderIntro: t("sliderIntro"),
      caseStudiesLabel: t("caseStudiesLabel"),
      caseStudiesHeading: t("caseStudiesHeading"),
      caseStudiesIntro: t("caseStudiesIntro"),
      projectsLabel: t("projectsLabel"),
      projectsHeading: t("projectsHeading"),
      projectsIntro: t("projectsIntro"),
      contactLabel: t("contactLabel"),
      contactHeading: t("contactHeading"),
    },
    locale,
  );

  return (
    <div className="flex h-screen flex-col bg-white text-[#0f2744]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#e6e8ec] px-8 py-4">
        <p className="text-sm font-semibold tracking-wide">
          {siteData.settings?.brand_name ?? "The Dental Lounge"}
        </p>
        <p className="text-xs text-[#6b7280]">EN · AR</p>
      </header>
      <main
        className="min-h-0 flex-1 overflow-y-auto pb-16"
        data-showreel-action="booking-scroll"
      >
        <DentalContactSection
          settings={siteData.settings}
          services={siteData.services}
          copy={copy.contact}
          number="06"
        />
      </main>
    </div>
  );
}

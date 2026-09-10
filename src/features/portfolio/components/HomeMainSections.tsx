"use client";

import type { PortfolioData } from "@/services/portfolio";
import { useLocale, useTranslations } from "@/lib/i18n";
import {
  getHomepageSectionNumber,
  getVisibleHomepageSections,
  resolveDentalSectionCopy,
} from "../lib/homepageSectionCopy";
import { HomepageSectionBlock } from "./HomepageSectionBlock";

type Props = {
  data: PortfolioData;
  onImageClick?: (src: string, alt: string) => void;
};

/** Renders homepage body sections in saved order (Hero is outside). */
export function HomeMainSections({ data, onImageClick }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const copy = resolveDentalSectionCopy(
    data.settings,
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
      faqLabel: t("faqLabel"),
      faqHeading: t("faqHeading"),
      faqIntro: t("faqIntro"),
      contactLabel: t("contactLabel"),
      contactHeading: t("contactHeading"),
    },
    locale,
  );
  const visible = getVisibleHomepageSections(
    data.settings?.homepage_section_order,
    data.settings?.homepage_hidden_sections,
  );
  const handleImageClick = onImageClick ?? (() => undefined);

  return (
    <>
      {visible.map((key) => (
        <HomepageSectionBlock
          key={key}
          sectionKey={key}
          data={data}
          copy={copy}
          number={getHomepageSectionNumber(
            data.settings?.homepage_section_order,
            data.settings?.homepage_hidden_sections,
            key,
          )}
          onImageClick={handleImageClick}
        />
      ))}
    </>
  );
}

import type { Tables } from "@/lib/supabase/database.types";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import { localizedCms } from "@/lib/i18n/pickLocalized";
import type { HomepageSectionKey } from "./homepageSectionOrder";
import {
  getVisibleHomepageSections,
  normalizeHomepageSectionOrder,
} from "./homepageSectionOrder";

export type DentalSectionCopy = {
  about: { label: string };
  services: {
    solutionsTitle: string;
    solutionsIntro: string;
    label: string;
    heading: string;
    intro: string;
  };
  gallery: { label: string; heading: string; intro: string };
  slider: { label: string; heading: string; intro: string };
  caseStudies: { label: string; heading: string; intro: string };
  featured: { label: string; heading: string; intro: string };
  contact: { label: string; heading: string };
};

type I18nDental = {
  aboutLabel: string;
  solutionsTitle: string;
  solutionsSide: string;
  servicesLabel: string;
  servicesHeading: string;
  servicesIntro: string;
  galleryLabel: string;
  galleryHeading: string;
  galleryIntro: string;
  sliderLabel: string;
  sliderHeading: string;
  sliderIntro: string;
  caseStudiesLabel: string;
  caseStudiesHeading: string;
  caseStudiesIntro: string;
  projectsLabel: string;
  projectsHeading: string;
  projectsIntro: string;
  contactLabel: string;
  contactHeading: string;
};

export function resolveDentalSectionCopy(
  settings: Tables<"site_settings"> | null | undefined,
  t: I18nDental,
  locale: Locale = "en",
): DentalSectionCopy {
  return {
    about: {
      label: localizedCms(
        locale,
        settings?.about_title,
        settings?.about_title_ar,
        t.aboutLabel,
      ),
    },
    services: {
      solutionsTitle: localizedCms(
        locale,
        settings?.solutions_title,
        settings?.solutions_title_ar,
        t.solutionsTitle,
      ),
      solutionsIntro: localizedCms(
        locale,
        settings?.solutions_description,
        settings?.solutions_description_ar,
        t.solutionsSide,
      ),
      label: localizedCms(
        locale,
        settings?.services_title,
        settings?.services_title_ar,
        t.servicesLabel,
      ),
      heading: localizedCms(
        locale,
        settings?.services_heading,
        settings?.services_heading_ar,
        t.servicesHeading,
      ),
      intro: localizedCms(
        locale,
        settings?.services_description,
        settings?.services_description_ar,
        t.servicesIntro,
      ),
    },
    gallery: {
      label: localizedCms(
        locale,
        settings?.gallery_title,
        settings?.gallery_title_ar,
        t.galleryLabel,
      ),
      heading: localizedCms(
        locale,
        settings?.gallery_heading,
        settings?.gallery_heading_ar,
        t.galleryHeading,
      ),
      intro: localizedCms(
        locale,
        settings?.gallery_description,
        settings?.gallery_description_ar,
        t.galleryIntro,
      ),
    },
    slider: {
      label: localizedCms(
        locale,
        settings?.featured_title,
        settings?.featured_title_ar,
        t.sliderLabel,
      ),
      heading: localizedCms(
        locale,
        settings?.slider_heading,
        settings?.slider_heading_ar,
        t.sliderHeading,
      ),
      intro: localizedCms(
        locale,
        settings?.featured_description,
        settings?.featured_description_ar,
        t.sliderIntro,
      ),
    },
    caseStudies: {
      label: localizedCms(
        locale,
        settings?.case_studies_title,
        settings?.case_studies_title_ar,
        t.caseStudiesLabel,
      ),
      heading: t.caseStudiesHeading,
      intro: localizedCms(
        locale,
        settings?.case_studies_description,
        settings?.case_studies_description_ar,
        t.caseStudiesIntro,
      ),
    },
    featured: {
      label: t.projectsLabel,
      heading: t.projectsHeading,
      intro: t.projectsIntro,
    },
    contact: {
      label: localizedCms(
        locale,
        settings?.contact_title,
        settings?.contact_title_ar,
        t.contactLabel,
      ),
      heading: localizedCms(
        locale,
        settings?.contact_headline,
        settings?.contact_headline_ar,
        t.contactHeading,
      ),
    },
  };
}

export function getHomepageSectionNumber(
  order: string[] | null | undefined,
  hidden: string[] | null | undefined,
  key: HomepageSectionKey,
): string {
  const visible = getVisibleHomepageSections(order, hidden);
  const index = visible.indexOf(key);
  if (index < 0) return "";
  return `(${String(index + 1).padStart(2, "0")})`;
}

export { getVisibleHomepageSections, normalizeHomepageSectionOrder };

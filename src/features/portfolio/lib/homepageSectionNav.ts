import type { SiteSettings } from "@/services/site_settings";
import {
  HOMEPAGE_SECTION_LABELS,
  isHomepageSectionHidden,
  type HomepageSectionKey,
} from "./homepageSectionOrder";

export const HOMEPAGE_SECTION_NAV: Record<
  HomepageSectionKey,
  { href: string; navLabel: string }
> = {
  about: { href: "#about", navLabel: "About" },
  services: { href: "#services", navLabel: "Services" },
  gallery: { href: "#gallery", navLabel: "Successful Cases" },
  slider: { href: "#more-images", navLabel: "More Images" },
  "case-studies": { href: "#case-studies", navLabel: "Case studies" },
  featured: { href: "#featured", navLabel: "Projects" },
  contact: { href: "#contact", navLabel: "Contact" },
};

const PAGE_SECTION_HREFS: Record<string, string[]> = {
  "case-studies": ["/case-studies", "#case-studies"],
  featured: ["/featured", "#featured"],
};

export type HomepageSectionTitleField = {
  key: keyof SiteSettings;
  label: string;
  multiline?: boolean;
};

export const HOMEPAGE_SECTION_TITLE_FIELDS: Record<
  HomepageSectionKey,
  HomepageSectionTitleField[]
> = {
  about: [{ key: "about_title", label: "Section label" }],
  services: [
    { key: "solutions_title", label: "Solutions headline" },
    { key: "solutions_description", label: "Solutions intro", multiline: true },
    { key: "services_title", label: "Services label" },
    { key: "services_heading", label: "Services headline" },
    { key: "services_description", label: "Services intro", multiline: true },
  ],
  gallery: [
    { key: "gallery_title", label: "Section label" },
    { key: "gallery_heading", label: "Section headline" },
    { key: "gallery_description", label: "Section intro", multiline: true },
  ],
  slider: [
    { key: "featured_title", label: "Section label" },
    { key: "slider_heading", label: "Section headline" },
    { key: "featured_description", label: "Section intro", multiline: true },
  ],
  "case-studies": [
    { key: "case_studies_title", label: "Section label" },
    { key: "case_studies_description", label: "Section intro", multiline: true },
  ],
  featured: [],
  contact: [
    { key: "contact_title", label: "Section label" },
    { key: "contact_headline", label: "Section headline" },
  ],
};

export function isHomepageNavHrefVisible(
  href: string,
  hidden: string[] | null | undefined,
): boolean {
  const normalized = (href ?? "").trim();
  const hiddenSet = new Set(hidden ?? []);

  for (const key of Object.keys(HOMEPAGE_SECTION_NAV) as HomepageSectionKey[]) {
    if (HOMEPAGE_SECTION_NAV[key].href === normalized && hiddenSet.has(key)) {
      return false;
    }
  }

  for (const [key, hrefs] of Object.entries(PAGE_SECTION_HREFS)) {
    const root = hrefs[0];
    if (!root) continue;
    if (hrefs.includes(normalized) && hiddenSet.has(key)) return false;
    if (normalized.startsWith(`${root}/`) && hiddenSet.has(key)) return false;
  }

  return true;
}

export function isSitePageSectionVisible(
  key: HomepageSectionKey,
  hidden: string[] | null | undefined,
): boolean {
  return !isHomepageSectionHidden(hidden, key);
}

export function visibleHomepageNavKeys(
  hidden: string[] | null | undefined,
): HomepageSectionKey[] {
  const hiddenSet = new Set(hidden ?? []);
  return (Object.keys(HOMEPAGE_SECTION_NAV) as HomepageSectionKey[]).filter(
    (key) => !hiddenSet.has(key),
  );
}

export function sectionLabel(key: HomepageSectionKey): string {
  return HOMEPAGE_SECTION_LABELS[key];
}

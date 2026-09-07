import type { CustomizeSection } from "./types";
import type { AdminMessageKey } from "@/lib/i18n";

export const SECTION_LABEL_KEYS: Record<CustomizeSection, AdminMessageKey> = {
  hero: "admin.customize.section.hero",
  about: "admin.customize.section.about",
  services: "admin.customize.section.services",
  gallery: "admin.customize.section.gallery",
  slider: "admin.customize.section.slider",
  contact: "admin.customize.section.contact",
  "case-studies": "admin.customize.section.caseStudies",
  footer: "admin.customize.section.footer",
  settings: "admin.customize.section.settings",
};

/** English fallbacks for non-React contexts */
export const SECTION_LABELS: Record<CustomizeSection, string> = {
  hero: "Hero",
  about: "About",
  services: "Services",
  gallery: "Successful Cases",
  slider: "More Images",
  contact: "Contact",
  "case-studies": "Case studies",
  footer: "Footer",
  settings: "Settings",
};

export const SECTION_DOM_IDS: Record<CustomizeSection, string> = {
  hero: "home",
  about: "about",
  services: "services",
  gallery: "gallery",
  slider: "more-images",
  contact: "contact",
  "case-studies": "case-studies",
  footer: "contact",
  settings: "site-nav",
};

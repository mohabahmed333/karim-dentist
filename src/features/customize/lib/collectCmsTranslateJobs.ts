import type { PortfolioData } from "@/services/portfolio";
import type { SiteSettings } from "@/services/site_settings";
import type {
  ParsedCaseStudySection,
  SectionContent,
} from "@/services/case_study_sections";
import type { CollectionSection, CustomizeSection } from "../types";
import type { TranslateSource } from "./translateText";
import {
  collectSectionTextPairs,
  contentPatchForPair,
} from "./sectionContentTranslate";

export type TranslateDirection = "to-ar" | "to-en";

/** `all` = every CMS bilingual field; otherwise one Customize section. */
export type CmsTranslateScope = "all" | CustomizeSection;

/** Multi-select translate target: all modules, or a subset of sections. */
export type CmsTranslateSelection = "all" | readonly CustomizeSection[];

export type CmsTranslateJob = {
  key: string;
  text: string;
  apply: (translated: string) => void;
};

type ApplyFns = {
  patchHero: (partial: Partial<NonNullable<PortfolioData["hero"]>>) => void;
  patchAbout: (partial: Partial<NonNullable<PortfolioData["about"]>>) => void;
  patchCallout: (
    partial: Partial<NonNullable<PortfolioData["callout"]>>,
  ) => void;
  patchSettings: (
    partial: Partial<NonNullable<PortfolioData["settings"]>>,
  ) => void;
  patchTrustItem: (id: string, partial: Record<string, string>) => void;
  patchSolutionPanel: (id: string, partial: Record<string, string>) => void;
  patchGalleryItem: (id: string, partial: Record<string, string>) => void;
  patchCollectionItem: (
    section: CollectionSection,
    id: string,
    partial: Record<string, unknown>,
  ) => void;
  patchCaseStudySection: (
    caseStudyId: string,
    sectionId: string,
    partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
  ) => void;
  patchFeaturedSection: (
    featuredProjectId: string,
    sectionId: string,
    partial: Partial<ParsedCaseStudySection> & { content?: SectionContent },
  ) => void;
};

type JobSection = CustomizeSection | "callout";

const SETTINGS_KEYS_BY_SECTION: Partial<
  Record<CustomizeSection, ReadonlyArray<keyof SiteSettings>>
> = {
  about: ["about_title"],
  services: [
    "solutions_title",
    "solutions_description",
    "services_title",
    "services_heading",
    "services_description",
  ],
  gallery: ["gallery_title", "gallery_heading", "gallery_description"],
  slider: ["featured_title", "featured_description", "slider_heading"],
  contact: [
    "contact_title",
    "contact_headline",
    "contact_blurb",
    "contact_clinic_name",
    "contact_doctor_name",
    "contact_credentials",
  ],
  footer: ["footer_tagline"],
  "case-studies": ["case_studies_title", "case_studies_description"],
};

const HERO_COPY_KEYS = [
  "kicker",
  "headline",
  "accent",
  "body",
  "cta_primary_label",
  "cta_secondary_label",
] as const;

export const CMS_TRANSLATE_SCOPE_OPTIONS: Array<{
  value: CmsTranslateScope;
  label: string;
}> = [
  { value: "all", label: "All sections" },
  { value: "hero", label: "Hero" },
  { value: "about", label: "About" },
  { value: "services", label: "Services" },
  { value: "gallery", label: "Successful Cases" },
  { value: "slider", label: "More Images" },
  { value: "contact", label: "Contact" },
  { value: "footer", label: "Footer" },
  { value: "case-studies", label: "Case studies" },
  { value: "settings", label: "Settings" },
];

export function cmsTranslateScopeLabel(scope: CmsTranslateScope): string {
  return (
    CMS_TRANSLATE_SCOPE_OPTIONS.find((option) => option.value === scope)
      ?.label ?? scope
  );
}

export function cmsTranslateSelectionLabel(
  selection: CmsTranslateSelection,
): string {
  if (selection === "all") return "All modules";
  if (selection.length === 1) {
    const only = selection[0];
    return only ? cmsTranslateScopeLabel(only) : "0 modules";
  }
  return `${selection.length} modules`;
}

function selectionIncludes(
  selection: CmsTranslateSelection,
  section: JobSection,
) {
  if (selection === "all") return true;
  if (section === "callout") return selection.includes("settings");
  return selection.includes(section);
}

function pushPair(
  jobs: CmsTranslateJob[],
  selection: CmsTranslateSelection,
  section: JobSection,
  key: string,
  en: string | null | undefined,
  ar: string | null | undefined,
  direction: TranslateDirection,
  setEn: (value: string) => void,
  setAr: (value: string) => void,
) {
  if (!selectionIncludes(selection, section)) return;
  const english = (en ?? "").trim();
  const arabic = (ar ?? "").trim();
  if (direction === "to-ar") {
    if (!english) return;
    jobs.push({ key, text: english, apply: setAr });
    return;
  }
  if (!arabic) return;
  jobs.push({ key, text: arabic, apply: setEn });
}

export function sourceForDirection(
  direction: TranslateDirection,
): TranslateSource {
  return direction === "to-ar" ? "en" : "ar";
}

function settingsKeysForSelection(
  selection: CmsTranslateSelection,
): Array<keyof SiteSettings> {
  if (selection === "all" || selection.includes("settings")) {
    return Object.values(SETTINGS_KEYS_BY_SECTION).flat() as Array<
      keyof SiteSettings
    >;
  }
  return selection.flatMap(
    (section) => SETTINGS_KEYS_BY_SECTION[section] ?? [],
  );
}

/** Collect CMS bilingual pairs for the chosen selection. */
export function collectCmsTranslateJobs(
  data: PortfolioData,
  direction: TranslateDirection,
  apply: ApplyFns,
  selection: CmsTranslateSelection = "all",
): CmsTranslateJob[] {
  const jobs: CmsTranslateJob[] = [];
  const hero = data.hero;
  if (hero) {
    for (const field of HERO_COPY_KEYS) {
      const arKey = `${field}_ar` as keyof typeof hero;
      pushPair(
        jobs,
        selection,
        "hero",
        `hero.${field}`,
        String(hero[field] ?? ""),
        String(hero[arKey] ?? ""),
        direction,
        (value) => apply.patchHero({ [field]: value }),
        (value) => apply.patchHero({ [arKey]: value }),
      );
    }
  }

  const about = data.about;
  if (about) {
    pushPair(
      jobs,
      selection,
      "about",
      "about.body",
      about.body,
      about.body_ar,
      direction,
      (value) => apply.patchAbout({ body: value }),
      (value) => apply.patchAbout({ body_ar: value }),
    );
  }

  for (const item of data.trustItems ?? []) {
    pushPair(
      jobs,
      selection,
      "about",
      `trust.${item.id}.value`,
      item.value,
      item.value_ar,
      direction,
      (value) => apply.patchTrustItem(item.id, { value }),
      (value) => apply.patchTrustItem(item.id, { value_ar: value }),
    );
    pushPair(
      jobs,
      selection,
      "about",
      `trust.${item.id}.label`,
      item.label,
      item.label_ar,
      direction,
      (value) => apply.patchTrustItem(item.id, { label: value }),
      (value) => apply.patchTrustItem(item.id, { label_ar: value }),
    );
  }

  for (const panel of data.solutionPanels ?? []) {
    pushPair(
      jobs,
      selection,
      "services",
      `solution.${panel.id}.title`,
      panel.title,
      panel.title_ar,
      direction,
      (value) => apply.patchSolutionPanel(panel.id, { title: value }),
      (value) => apply.patchSolutionPanel(panel.id, { title_ar: value }),
    );
    pushPair(
      jobs,
      selection,
      "services",
      `solution.${panel.id}.body`,
      panel.body,
      panel.body_ar,
      direction,
      (value) => apply.patchSolutionPanel(panel.id, { body: value }),
      (value) => apply.patchSolutionPanel(panel.id, { body_ar: value }),
    );
  }

  for (const item of data.galleryItems ?? []) {
    pushPair(
      jobs,
      selection,
      "gallery",
      `gallery.${item.id}.caption`,
      item.caption,
      item.caption_ar,
      direction,
      (value) => apply.patchGalleryItem(item.id, { caption: value }),
      (value) => apply.patchGalleryItem(item.id, { caption_ar: value }),
    );
  }

  for (const service of data.services ?? []) {
    pushPair(
      jobs,
      selection,
      "services",
      `service.${service.id}.title`,
      service.title,
      service.title_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("services", service.id, { title: value }),
      (value) =>
        apply.patchCollectionItem("services", service.id, { title_ar: value }),
    );
    pushPair(
      jobs,
      selection,
      "services",
      `service.${service.id}.description`,
      service.description,
      service.description_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("services", service.id, {
          description: value,
        }),
      (value) =>
        apply.patchCollectionItem("services", service.id, {
          description_ar: value,
        }),
    );
  }

  for (const link of data.footerLinks ?? []) {
    pushPair(
      jobs,
      selection,
      "footer",
      `footer.${link.id}.label`,
      link.label,
      link.label_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("footer", link.id, { label: value }),
      (value) =>
        apply.patchCollectionItem("footer", link.id, { label_ar: value }),
    );
  }

  for (const study of data.caseStudies ?? []) {
    pushPair(
      jobs,
      selection,
      "case-studies",
      `caseStudy.${study.id}.title`,
      study.title,
      study.title_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("case-studies", study.id, { title: value }),
      (value) =>
        apply.patchCollectionItem("case-studies", study.id, {
          title_ar: value,
        }),
    );
    pushPair(
      jobs,
      selection,
      "case-studies",
      `caseStudy.${study.id}.description`,
      study.description,
      study.description_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("case-studies", study.id, {
          description: value,
        }),
      (value) =>
        apply.patchCollectionItem("case-studies", study.id, {
          description_ar: value,
        }),
    );
  }

  for (const [caseStudyId, sections] of Object.entries(
    data.caseStudySections ?? {},
  )) {
    for (const section of sections) {
      const content = section.content as Record<string, unknown>;
      for (const pair of collectSectionTextPairs(section.type, content)) {
        pushPair(
          jobs,
          selection,
          "case-studies",
          `caseStudySection.${caseStudyId}.${section.id}.${pair.path}`,
          pair.en,
          pair.ar,
          direction,
          (value) =>
            apply.patchCaseStudySection(caseStudyId, section.id, {
              content: contentPatchForPair(pair, "en", value) as never,
            }),
          (value) =>
            apply.patchCaseStudySection(caseStudyId, section.id, {
              content: contentPatchForPair(pair, "ar", value) as never,
            }),
        );
      }
    }
  }

  for (const project of data.featured ?? []) {
    pushPair(
      jobs,
      selection,
      "slider",
      `featured.${project.id}.title`,
      project.title,
      project.title_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("slider", project.id, { title: value }),
      (value) =>
        apply.patchCollectionItem("slider", project.id, { title_ar: value }),
    );
    pushPair(
      jobs,
      selection,
      "slider",
      `featured.${project.id}.eyebrow`,
      project.eyebrow,
      project.eyebrow_ar,
      direction,
      (value) =>
        apply.patchCollectionItem("slider", project.id, { eyebrow: value }),
      (value) =>
        apply.patchCollectionItem("slider", project.id, { eyebrow_ar: value }),
    );
  }

  for (const [featuredProjectId, sections] of Object.entries(
    data.featuredProjectSections ?? {},
  )) {
    for (const section of sections) {
      const content = section.content as Record<string, unknown>;
      for (const pair of collectSectionTextPairs(section.type, content)) {
        pushPair(
          jobs,
          selection,
          "slider",
          `featuredSection.${featuredProjectId}.${section.id}.${pair.path}`,
          pair.en,
          pair.ar,
          direction,
          (value) =>
            apply.patchFeaturedSection(featuredProjectId, section.id, {
              content: contentPatchForPair(pair, "en", value) as never,
            }),
          (value) =>
            apply.patchFeaturedSection(featuredProjectId, section.id, {
              content: contentPatchForPair(pair, "ar", value) as never,
            }),
        );
      }
    }
  }

  const callout = data.callout;
  if (callout) {
    pushPair(
      jobs,
      selection,
      "callout",
      "callout.body",
      callout.body,
      callout.body_ar,
      direction,
      (value) => apply.patchCallout({ body: value }),
      (value) => apply.patchCallout({ body_ar: value }),
    );
  }

  const settings = data.settings;
  if (settings) {
    const forceSettingsSection =
      selection === "all" || selection.includes("settings");
    const uniqueFields = [...new Set(settingsKeysForSelection(selection))];
    for (const field of uniqueFields) {
      const arKey = `${String(field)}_ar` as keyof SiteSettings;
      const sectionForField =
        (Object.entries(SETTINGS_KEYS_BY_SECTION).find(([, keys]) =>
          keys.includes(field),
        )?.[0] as CustomizeSection | undefined) ?? "settings";

      pushPair(
        jobs,
        selection,
        forceSettingsSection ? "settings" : sectionForField,
        `settings.${String(field)}`,
        String(settings[field] ?? ""),
        String(settings[arKey] ?? ""),
        direction,
        (value) =>
          apply.patchSettings({ [field]: value } as Partial<SiteSettings>),
        (value) =>
          apply.patchSettings({ [arKey]: value } as Partial<SiteSettings>),
      );
    }
  }

  return jobs;
}

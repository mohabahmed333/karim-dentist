import { createClient } from "@/lib/supabase/server";
import { parseSectionContent, type SectionType } from "@/services/case_study_sections";
import {
  collectCaseStudyDetailPageIds,
  collectFeaturedDetailPageIds,
} from "@/features/portfolio/lib/detailPageLink";
import {
  dentalGalleryComparisonsFallback,
  dentalGalleryItemsFallback,
  dentalGalleryShowcaseFallback,
  dentalSolutionsFallback,
  dentalTrustFallback,
} from "@/services/dental/fallback";
import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "@/services/dental/types";
import { portfolioFallback } from "./fallback";
import type { PortfolioData } from "./types";

async function fetchDentalExtras(supabase: Awaited<ReturnType<typeof createClient>>) {
  const defaults = {
    trustItems: dentalTrustFallback,
    solutionPanels: dentalSolutionsFallback,
    galleryItems: dentalGalleryItemsFallback,
    galleryShowcase: dentalGalleryShowcaseFallback,
    galleryComparisons: dentalGalleryComparisonsFallback,
  };

  try {
    const [trust, panels, gallery, showcase, comparisons] = await Promise.all([
      supabase.from("about_trust_items").select("*").order("sort_order"),
      supabase.from("solution_panels").select("*").order("sort_order"),
      supabase.from("gallery_items").select("*").order("sort_order"),
      supabase.from("gallery_showcase").select("*").limit(1).maybeSingle(),
      supabase.from("gallery_comparisons").select("*").order("sort_order"),
    ]);

    const comparisonRows = comparisons.data as GalleryComparison[] | null;

    return {
      trustItems: (trust.data as TrustItem[] | null) ?? defaults.trustItems,
      solutionPanels:
        (panels.data as SolutionPanel[] | null) ?? defaults.solutionPanels,
      galleryItems:
        (gallery.data as GalleryItem[] | null) ?? defaults.galleryItems,
      galleryShowcase:
        (showcase.data as GalleryShowcase | null) ?? defaults.galleryShowcase,
      galleryComparisons:
        comparisonRows && comparisonRows.length > 0
          ? comparisonRows
          : defaults.galleryComparisons,
    };
  } catch {
    return defaults;
  }
}

/** Full CMS payload for the customizer (includes unpublished). */
export async function getCustomizePortfolioData(): Promise<PortfolioData> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return portfolioFallback;
  }

  try {
    const supabase = await createClient();
    const results = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      supabase.from("hero").select("*").limit(1).maybeSingle(),
      supabase.from("about").select("*").limit(1).maybeSingle(),
      supabase.from("callouts").select("*").limit(1).maybeSingle(),
      supabase
        .from("case_studies")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("case_study_sections")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("featured_projects")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("featured_project_sections")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("experience_entries")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("services")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("faqs")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("footer_links")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("social_links")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      fetchDentalExtras(supabase),
    ]);

    const [
      settings,
      hero,
      about,
      callout,
      caseStudies,
      sectionRows,
      featured,
      featuredSectionRows,
      experience,
      services,
      faqs,
      clients,
      footerLinks,
      socialLinks,
      dentalExtras,
    ] = results;

    const caseStudySections: PortfolioData["caseStudySections"] = {};
    for (const row of sectionRows.data ?? []) {
      const type = row.type as SectionType;
      const parsed = {
        ...row,
        type,
        content: parseSectionContent(type, row.content),
      };
      const list = caseStudySections[row.case_study_id] ?? [];
      list.push(parsed);
      caseStudySections[row.case_study_id] = list;
    }

    const featuredProjectSections: PortfolioData["featuredProjectSections"] = {};
    for (const row of featuredSectionRows.data ?? []) {
      const type = row.type as SectionType;
      const parsed = {
        ...row,
        type,
        content: parseSectionContent(type, row.content),
      };
      const list = featuredProjectSections[row.featured_project_id] ?? [];
      list.push(parsed);
      featuredProjectSections[row.featured_project_id] = list;
    }

    const caseStudyItems = caseStudies.data ?? [];
    const featuredItems = featured.data ?? [];

    return {
      settings: settings.data ?? portfolioFallback.settings,
      hero: hero.data ?? portfolioFallback.hero,
      about: about.data ?? portfolioFallback.about,
      callout: callout.data ?? portfolioFallback.callout,
      caseStudies: caseStudyItems,
      caseStudySections,
      caseStudyDetailPageIds: collectCaseStudyDetailPageIds(
        caseStudyItems,
        caseStudySections,
      ),
      featured: featuredItems,
      featuredProjectSections,
      featuredDetailPageIds: collectFeaturedDetailPageIds(
        featuredItems,
        featuredProjectSections,
      ),
      experience: experience.data ?? [],
      services: services.data ?? [],
      faqs: faqs.data ?? [],
      clients: clients.data ?? [],
      footerLinks: footerLinks.data ?? [],
      socialLinks: socialLinks.data ?? [],
      ...dentalExtras,
    };
  } catch {
    return portfolioFallback;
  }
}

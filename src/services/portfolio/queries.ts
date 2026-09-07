import { createPublicClient } from "@/lib/supabase/public";
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
import { detailPageIdsFromCounts, groupSectionCounts } from "./sectionIds";
import type { PortfolioData } from "./types";

export type { PortfolioData } from "./types";

async function fetchDentalExtras(supabase: ReturnType<typeof createPublicClient>) {
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
      supabase
        .from("gallery_items")
        .select("*")
        .eq("is_published", true)
        .order("sort_order"),
      supabase.from("gallery_showcase").select("*").limit(1).maybeSingle(),
      supabase
        .from("gallery_comparisons")
        .select("*")
        .eq("is_published", true)
        .order("sort_order"),
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

export async function getPortfolioData(): Promise<PortfolioData> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return portfolioFallback;
  }

  try {
    const supabase = createPublicClient();
    const results = await Promise.all([
      supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      supabase.from("hero").select("*").limit(1).maybeSingle(),
      supabase.from("about").select("*").limit(1).maybeSingle(),
      supabase.from("callouts").select("*").limit(1).maybeSingle(),
      supabase
        .from("case_studies")
        .select("*")
        .is("deleted_at", null)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("case_study_sections")
        .select("case_study_id")
        .is("deleted_at", null)
        .eq("is_visible", true),
      supabase
        .from("featured_projects")
        .select("*")
        .is("deleted_at", null)
        .eq("is_published", true)
        .order("sort_order"),
      supabase
        .from("featured_project_sections")
        .select("featured_project_id")
        .is("deleted_at", null)
        .eq("is_visible", true),
      supabase
        .from("experience_entries")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order"),
      supabase
        .from("services")
        .select("*")
        .is("deleted_at", null)
        .eq("is_published", true)
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
      caseStudySectionRows,
      featured,
      featuredSectionRows,
      experience,
      services,
      clients,
      footerLinks,
      socialLinks,
      dentalExtras,
    ] = results;

    const caseStudyItems = caseStudies.data ?? [];
    const featuredItems = featured.data ?? [];
    const caseStudySectionCounts = groupSectionCounts(
      caseStudySectionRows.data ?? [],
      "case_study_id",
    );
    const featuredSectionCounts = groupSectionCounts(
      featuredSectionRows.data ?? [],
      "featured_project_id",
    );

    return {
      settings: settings.data ?? portfolioFallback.settings,
      hero: hero.data ?? portfolioFallback.hero,
      about: about.data ?? portfolioFallback.about,
      callout: callout.data ?? portfolioFallback.callout,
      caseStudies: caseStudyItems,
      caseStudySections: {},
      caseStudyDetailPageIds: detailPageIdsFromCounts(
        caseStudyItems,
        caseStudySectionCounts,
      ),
      featured:
        featuredItems.length > 0 ? featuredItems : portfolioFallback.featured,
      featuredProjectSections: {},
      featuredDetailPageIds: detailPageIdsFromCounts(
        featuredItems,
        featuredSectionCounts,
      ),
      experience: experience.data ?? [],
      services:
        (services.data?.length ?? 0) > 0
          ? services.data!
          : portfolioFallback.services,
      clients: clients.data ?? [],
      footerLinks:
        (footerLinks.data?.length ?? 0) > 0
          ? footerLinks.data!
          : portfolioFallback.footerLinks,
      socialLinks: socialLinks.data ?? [],
      ...dentalExtras,
    };
  } catch {
    return portfolioFallback;
  }
}

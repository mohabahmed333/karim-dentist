import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/sitemapEntries";
import { getSiteUrl, isProductionDeploy } from "@/lib/seo/siteUrl";
import { getCachedPortfolioData } from "@/services/portfolio/cached";

// Cached: see src/services/portfolio/cached.ts. Purged on admin save via
// notifyRevalidate(["portfolio"]).
export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never publish a preview or local build's URLs — robots.ts already
  // disallows everything there, and a sitemap only matters once crawling is
  // actually allowed.
  if (!isProductionDeploy()) return [];

  const portfolio = await getCachedPortfolioData();
  return buildSitemapEntries({
    siteUrl: getSiteUrl(),
    hiddenSections: portfolio.settings?.homepage_hidden_sections,
    caseStudies: portfolio.caseStudies,
    featuredProjects: portfolio.featured,
    services: portfolio.services,
  });
}

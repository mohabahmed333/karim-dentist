import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/sitemapEntries";
import { getSiteUrl, isProductionDeploy } from "@/lib/seo/siteUrl";
import { getPortfolioData } from "@/services/portfolio";

// createPublicClient() hardcodes cache: "no-store" (see llms.txt routes for
// the same conflict), so this route stays dynamic rather than `revalidate`
// until the caching phase wraps portfolio reads in unstable_cache.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never publish a preview or local build's URLs — robots.ts already
  // disallows everything there, and a sitemap only matters once crawling is
  // actually allowed.
  if (!isProductionDeploy()) return [];

  const portfolio = await getPortfolioData();
  return buildSitemapEntries({
    siteUrl: getSiteUrl(),
    hiddenSections: portfolio.settings?.homepage_hidden_sections,
    caseStudies: portfolio.caseStudies,
    featuredProjects: portfolio.featured,
  });
}

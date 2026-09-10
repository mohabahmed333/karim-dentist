import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";

export type SitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

type SlugRecord = {
  slug: string | null;
  is_published: boolean;
  deleted_at: string | null;
  updated_at: string;
};

type BuildSitemapInput = {
  siteUrl: string;
  hiddenSections: string[] | null | undefined;
  caseStudies: SlugRecord[];
  featuredProjects: SlugRecord[];
};

function isLive(record: SlugRecord): record is SlugRecord & { slug: string } {
  return Boolean(record.slug) && record.is_published && !record.deleted_at;
}

/**
 * Static + dynamic public routes for sitemap.xml. Gated by
 * isSitePageSectionVisible — the same check case-studies/page.tsx and
 * featured/page.tsx use to redirect home, so this never lists a URL that
 * would 307 away from itself. No AR entries: there is no /ar route yet, so
 * no alternates.languages either — that would assert a language variant
 * that doesn't exist.
 */
export function buildSitemapEntries(input: BuildSitemapInput): SitemapEntry[] {
  const { siteUrl, hiddenSections, caseStudies, featuredProjects } = input;
  const entries: SitemapEntry[] = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
  ];

  if (isSitePageSectionVisible("case-studies", hiddenSections)) {
    entries.push({
      url: `${siteUrl}/case-studies`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const study of caseStudies.filter(isLive)) {
      entries.push({
        url: `${siteUrl}/case-studies/${study.slug}`,
        lastModified: study.updated_at,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  if (isSitePageSectionVisible("featured", hiddenSections)) {
    entries.push({
      url: `${siteUrl}/featured`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const project of featuredProjects.filter(isLive)) {
      entries.push({
        url: `${siteUrl}/featured/${project.slug}`,
        lastModified: project.updated_at,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

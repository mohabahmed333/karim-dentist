import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import { localePath } from "@/lib/i18n/localePath";
import type { Locale } from "@/lib/i18n/localeStorage";

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
  alternates?: { languages: Record<string, string> };
};

type SlugRecord = {
  slug: string | null;
  is_published: boolean;
  deleted_at: string | null;
  updated_at: string;
};

type ServiceSlugRecord = SlugRecord & { title: string | null };

type BuildSitemapInput = {
  siteUrl: string;
  hiddenSections: string[] | null | undefined;
  caseStudies: SlugRecord[];
  featuredProjects: SlugRecord[];
  services?: ServiceSlugRecord[];
};

const LOCALES: readonly Locale[] = ["en", "ar"];

function isLive(record: SlugRecord): record is SlugRecord & { slug: string } {
  return Boolean(record.slug) && record.is_published && !record.deleted_at;
}

/**
 * One canonical bare path -> two <url> entries (en + ar), each carrying the
 * same reciprocal alternates.languages map (including a self-reference) —
 * this is what Google's hreflang validation expects: every language
 * version must declare all of them, including itself.
 */
function entriesForPath(
  siteUrl: string,
  path: string,
  opts: Pick<SitemapEntry, "lastModified" | "changeFrequency" | "priority">,
): SitemapEntry[] {
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${siteUrl}${localePath(locale, path)}`]),
  );
  return LOCALES.map((locale) => ({
    url: `${siteUrl}${localePath(locale, path)}`,
    ...opts,
    alternates: { languages },
  }));
}

/**
 * Static + dynamic public routes for sitemap.xml, in both locales. Gated by
 * isSitePageSectionVisible — the same check case-studies/page.tsx and
 * featured/page.tsx use to redirect home, so this never lists a URL that
 * would 307 away from itself.
 */
export function buildSitemapEntries(input: BuildSitemapInput): SitemapEntry[] {
  const { siteUrl, hiddenSections, caseStudies, featuredProjects } = input;
  const entries: SitemapEntry[] = [
    ...entriesForPath(siteUrl, "/", {
      changeFrequency: "weekly",
      priority: 1,
    }),
  ];

  if (isSitePageSectionVisible("case-studies", hiddenSections)) {
    entries.push(
      ...entriesForPath(siteUrl, "/case-studies", {
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    );
    for (const study of caseStudies.filter(isLive)) {
      entries.push(
        ...entriesForPath(siteUrl, `/case-studies/${study.slug}`, {
          lastModified: study.updated_at,
          changeFrequency: "monthly",
          priority: 0.6,
        }),
      );
    }
  }

  if (isSitePageSectionVisible("featured", hiddenSections)) {
    entries.push(
      ...entriesForPath(siteUrl, "/featured", {
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    );
    for (const project of featuredProjects.filter(isLive)) {
      entries.push(
        ...entriesForPath(siteUrl, `/featured/${project.slug}`, {
          lastModified: project.updated_at,
          changeFrequency: "monthly",
          priority: 0.6,
        }),
      );
    }
  }

  // Individual service pages. Gated on the same "services" homepage
  // section toggle as the catalogue itself, and on a real (non-placeholder)
  // title — a page titled "Untitled" is not worth advertising to Google.
  if (isSitePageSectionVisible("services", hiddenSections)) {
    for (const service of (input.services ?? []).filter(
      (s): s is ServiceSlugRecord & { slug: string } =>
        isLive(s) && hasVisibleServiceTitle(s.title),
    )) {
      entries.push(
        ...entriesForPath(siteUrl, `/services/${service.slug}`, {
          lastModified: service.updated_at,
          changeFrequency: "monthly",
          priority: 0.6,
        }),
      );
    }
  }

  return entries;
}

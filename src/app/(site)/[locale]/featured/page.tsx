import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { FeaturedIndexView } from "@/features/portfolio";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getCachedPortfolioData } from "@/services/portfolio/cached";
import { isLocale, localePath } from "@/lib/i18n/localePath";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { buildAlternates } from "@/lib/seo/alternates";

// Cached: getCachedPortfolioData() isolates the underlying
// no-store fetch behind Next's Data Cache, so this route can be
// static/ISR instead of rendering fresh on every request. Purged on
// admin save via notifyRevalidate(["portfolio"]); this window is the
// self-healing safety net if that call is ever missed.
export const revalidate = 900;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const portfolio = await getCachedPortfolioData();
  const title = pickLocalized(
    locale,
    portfolio.settings?.featured_title,
    portfolio.settings?.featured_title_ar,
  );
  const description = pickLocalized(
    locale,
    portfolio.settings?.featured_description,
    portfolio.settings?.featured_description_ar,
  );
  return {
    title: title || "Projects",
    description: description || "Selected clinic work from The Dental Lounge.",
    alternates: buildAlternates(locale, "/featured", getSiteUrl()),
  };
}

export default async function FeaturedIndexPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const portfolio = await getCachedPortfolioData();
  if (
    !isSitePageSectionVisible(
      "featured",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    redirect(localePath(locale, "/"));
  }

  return (
    <DentalSitePage data={portfolio}>
      <FeaturedIndexView
        items={portfolio.featured}
        title={
          portfolio.settings?.featured_title || "Selected clinic work"
        }
        titleAr={portfolio.settings?.featured_title_ar || ""}
        description={
          portfolio.settings?.featured_description ||
          "Highlights from treatments, spaces, and studio work."
        }
        descriptionAr={portfolio.settings?.featured_description_ar || ""}
        detailPageIds={portfolio.featuredDetailPageIds}
      />
    </DentalSitePage>
  );
}

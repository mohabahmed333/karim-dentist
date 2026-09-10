import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudiesIndexView } from "@/features/portfolio";
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
    portfolio.settings?.case_studies_title,
    portfolio.settings?.case_studies_title_ar,
  );
  const description = pickLocalized(
    locale,
    portfolio.settings?.case_studies_description,
    portfolio.settings?.case_studies_description_ar,
  );
  return {
    title: title || "Case Studies",
    description:
      description || "Selected treatments and outcomes from The Dental Lounge.",
    alternates: buildAlternates(locale, "/case-studies", getSiteUrl()),
  };
}

export default async function CaseStudiesIndexPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const portfolio = await getCachedPortfolioData();
  if (
    !isSitePageSectionVisible(
      "case-studies",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    redirect(localePath(locale, "/"));
  }

  const title = portfolio.settings?.case_studies_title || "Case studies";
  const titleAr = portfolio.settings?.case_studies_title_ar || "";
  const description =
    portfolio.settings?.case_studies_description ||
    "Selected treatments and outcomes from The Dental Lounge.";
  const descriptionAr = portfolio.settings?.case_studies_description_ar || "";

  return (
    <DentalSitePage data={portfolio}>
      <CaseStudiesIndexView
        items={portfolio.caseStudies}
        title={title}
        titleAr={titleAr}
        description={description}
        descriptionAr={descriptionAr}
        detailPageIds={portfolio.caseStudyDetailPageIds}
      />
    </DentalSitePage>
  );
}

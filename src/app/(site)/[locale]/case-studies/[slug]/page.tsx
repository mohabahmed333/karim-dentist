import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getCaseStudyPageData } from "@/services/portfolio/caseStudyPage";
import { buildArticleNode, buildBreadcrumbList, wrapGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { isLocale, localePath } from "@/lib/i18n/localePath";
import { pickLocalized } from "@/lib/i18n/pickLocalized";
import { buildAlternates } from "@/lib/seo/alternates";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  const page = await getCaseStudyPageData(slug);
  if (!page) return { title: "Case study not found" };
  const title = pickLocalized(locale, page.study.title, page.study.title_ar);
  const description = pickLocalized(
    locale,
    page.study.description,
    page.study.description_ar,
  );
  return {
    title: `${title || page.study.title} — Case study`,
    description: description || page.study.description,
    alternates: buildAlternates(
      locale,
      `/case-studies/${slug}`,
      getSiteUrl(),
    ),
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const [page, portfolio] = await Promise.all([
    getCaseStudyPageData(slug),
    getPortfolioData(),
  ]);
  if (!page) notFound();
  if (
    !isSitePageSectionVisible(
      "case-studies",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    redirect(localePath(locale, "/"));
  }

  const backLabel = pickLocalized(
    locale,
    portfolio.settings?.case_studies_title,
    portfolio.settings?.case_studies_title_ar,
  ) || "Case studies";
  const siteUrl = getSiteUrl();
  // Breadcrumb + Article URLs reflect the current page's own locale — a
  // visitor on /ar/case-studies/x should see the trail stay in Arabic.
  const path = localePath(locale, `/case-studies/${slug}`);
  const breadcrumb = buildBreadcrumbList(siteUrl, [
    { name: "Home", path: localePath(locale, "/") },
    { name: backLabel, path: localePath(locale, "/case-studies") },
    {
      name: pickLocalized(locale, page.study.title, page.study.title_ar),
      path,
    },
  ]);
  const article = buildArticleNode({
    siteUrl,
    path,
    headline: pickLocalized(locale, page.study.title, page.study.title_ar),
    description: pickLocalized(
      locale,
      page.study.description,
      page.study.description_ar,
    ),
    image: page.study.media_url,
    datePublished: page.study.created_at,
    dateModified: page.study.updated_at,
    authorName: portfolio.settings?.contact_doctor_name || "The Dental Lounge",
    clinicId: `${siteUrl}/#clinic`,
  });

  return (
    <DentalSitePage data={portfolio}>
      <JsonLd graph={wrapGraph([breadcrumb, article])} />
      <div className="mx-auto max-w-[1180px] px-[clamp(1rem,3vw,2.5rem)] pt-8">
        <DentalLocalizedBackLink
          href="/case-studies"
          label={portfolio.settings?.case_studies_title || "Case studies"}
          labelAr={portfolio.settings?.case_studies_title_ar}
        />
      </div>
      <CaseStudyPageView
        sections={page.sections}
        fallbackTitle={page.study.title}
        fallbackTitleAr={page.study.title_ar}
        fallbackDescription={page.study.description}
        fallbackDescriptionAr={page.study.description_ar}
      />
    </DentalSitePage>
  );
}

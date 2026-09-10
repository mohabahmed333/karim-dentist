import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getFeaturedProjectPageData } from "@/services/portfolio/featuredProjectPage";
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
  const page = await getFeaturedProjectPageData(slug);
  if (!page) return { title: "Project not found" };
  const title = pickLocalized(
    locale,
    page.project.title,
    page.project.title_ar,
  );
  const eyebrow = pickLocalized(
    locale,
    page.project.eyebrow,
    page.project.eyebrow_ar,
  );
  return {
    title: `${title || page.project.title} — Projects`,
    description: eyebrow || page.project.eyebrow || page.project.title,
    alternates: buildAlternates(locale, `/featured/${slug}`, getSiteUrl()),
  };
}

export default async function FeaturedProjectPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const [page, portfolio] = await Promise.all([
    getFeaturedProjectPageData(slug),
    getPortfolioData(),
  ]);
  if (!page) notFound();
  if (
    !isSitePageSectionVisible(
      "featured",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    redirect(localePath(locale, "/"));
  }

  const backLabel =
    pickLocalized(
      locale,
      portfolio.settings?.featured_title,
      portfolio.settings?.featured_title_ar,
    ) || "Projects";
  const siteUrl = getSiteUrl();
  const path = localePath(locale, `/featured/${slug}`);
  const breadcrumb = buildBreadcrumbList(siteUrl, [
    { name: "Home", path: localePath(locale, "/") },
    { name: backLabel, path: localePath(locale, "/featured") },
    {
      name: pickLocalized(locale, page.project.title, page.project.title_ar),
      path,
    },
  ]);
  const article = buildArticleNode({
    siteUrl,
    path,
    headline: pickLocalized(locale, page.project.title, page.project.title_ar),
    description: pickLocalized(
      locale,
      page.project.eyebrow,
      page.project.eyebrow_ar,
    ),
    image: page.project.image_url,
    datePublished: page.project.created_at,
    dateModified: page.project.updated_at,
    authorName: portfolio.settings?.contact_doctor_name || "The Dental Lounge",
    clinicId: `${siteUrl}/#clinic`,
  });

  return (
    <DentalSitePage data={portfolio}>
      <JsonLd graph={wrapGraph([breadcrumb, article])} />
      <div className="mx-auto max-w-[1180px] px-[clamp(1rem,3vw,2.5rem)] pt-8">
        <DentalLocalizedBackLink
          href="/featured"
          label={portfolio.settings?.featured_title || "Projects"}
          labelAr={portfolio.settings?.featured_title_ar}
        />
      </div>
      <CaseStudyPageView
        sections={page.sections}
        fallbackTitle={page.project.title}
        fallbackTitleAr={page.project.title_ar}
        fallbackDescription={page.project.eyebrow}
        fallbackDescriptionAr={page.project.eyebrow_ar}
      />
    </DentalSitePage>
  );
}

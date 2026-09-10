import { notFound, redirect } from "next/navigation";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getCaseStudyPageData } from "@/services/portfolio/caseStudyPage";
import { buildArticleNode, buildBreadcrumbList, wrapGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { getSiteUrl } from "@/lib/seo/siteUrl";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getCaseStudyPageData(slug);
  if (!page) return { title: "Case study not found" };
  return {
    title: `${page.study.title} — Case study`,
    description: page.study.description,
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
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
    redirect("/");
  }

  const backLabel =
    portfolio.settings?.case_studies_title || "Case studies";
  const siteUrl = getSiteUrl();
  const path = `/case-studies/${slug}`;
  const breadcrumb = buildBreadcrumbList(siteUrl, [
    { name: "Home", path: "/" },
    { name: backLabel, path: "/case-studies" },
    { name: page.study.title, path },
  ]);
  const article = buildArticleNode({
    siteUrl,
    path,
    headline: page.study.title,
    description: page.study.description,
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
          label={backLabel}
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

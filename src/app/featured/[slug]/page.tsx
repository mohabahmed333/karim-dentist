import { notFound, redirect } from "next/navigation";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getFeaturedProjectPageData } from "@/services/portfolio/featuredProjectPage";
import { buildArticleNode, buildBreadcrumbList, wrapGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { getSiteUrl } from "@/lib/seo/siteUrl";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = await getFeaturedProjectPageData(slug);
  if (!page) return { title: "Project not found" };
  return {
    title: `${page.project.title} — Projects`,
    description: page.project.eyebrow || page.project.title,
  };
}

export default async function FeaturedProjectPage({ params }: Props) {
  const { slug } = await params;
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
    redirect("/");
  }

  const backLabel = portfolio.settings?.featured_title || "Projects";
  const siteUrl = getSiteUrl();
  const path = `/featured/${slug}`;
  const breadcrumb = buildBreadcrumbList(siteUrl, [
    { name: "Home", path: "/" },
    { name: backLabel, path: "/featured" },
    { name: page.project.title, path },
  ]);
  const article = buildArticleNode({
    siteUrl,
    path,
    headline: page.project.title,
    description: page.project.eyebrow,
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
          label={backLabel}
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

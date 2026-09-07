import { notFound, redirect } from "next/navigation";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getFeaturedProjectPageData } from "@/services/portfolio/featuredProjectPage";

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

  return (
    <DentalSitePage data={portfolio}>
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

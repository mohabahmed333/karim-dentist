import { notFound, redirect } from "next/navigation";
import { CaseStudyPageView } from "@/features/portfolio";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";
import { getCaseStudyPageData } from "@/services/portfolio/caseStudyPage";

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

  return (
    <DentalSitePage data={portfolio}>
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

import { redirect } from "next/navigation";
import { CaseStudiesIndexView } from "@/features/portfolio";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Case Studies",
  description: "Selected treatments and outcomes from The Dental Lounge.",
};

export default async function CaseStudiesIndexPage() {
  const portfolio = await getPortfolioData();
  if (
    !isSitePageSectionVisible(
      "case-studies",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    redirect("/");
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

import { redirect } from "next/navigation";
import { FeaturedIndexView } from "@/features/portfolio";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects",
  description: "Selected clinic work from The Dental Lounge.",
};

export default async function FeaturedIndexPage() {
  const portfolio = await getPortfolioData();
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

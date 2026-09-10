import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DentalHomePage } from "@/features/portfolio/components/dental/DentalHomePage";
import { getPortfolioData } from "@/services/portfolio";
import { isLocale } from "@/lib/i18n/localePath";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { buildAlternates } from "@/lib/seo/alternates";
import { buildFaqPageNode, wrapGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : "en";
  return { alternates: buildAlternates(locale, "/", getSiteUrl()) };
}

export default async function HomePage({ params }: Props) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const data = await getPortfolioData();
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo =
    data.settings?.brand_logo_url ??
    "/dental/766800441_18084577118253727_1449914596899119909_n.jpg";

  // Only emit FAQPage when the section is actually visible on the
  // homepage — structured data shouldn't describe content a visitor
  // can't see.
  const faqNode = isSitePageSectionVisible(
    "faq",
    data.settings?.homepage_hidden_sections,
  )
    ? buildFaqPageNode({ locale, items: data.faqs })
    : null;

  return (
    <>
      {faqNode ? <JsonLd graph={wrapGraph([faqNode])} /> : null}
      <DentalHomePage data={data} brand={brand} brandLogo={brandLogo} />
    </>
  );
}

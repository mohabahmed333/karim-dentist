import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DentalLocalizedBackLink } from "@/features/portfolio/components/dental/DentalLocalizedBackLink";
import { DentalSitePage } from "@/features/portfolio/components/dental/DentalSitePage";
import { ServiceDetailView } from "@/features/portfolio/components/dental/ServiceDetailView";
import { isSitePageSectionVisible } from "@/features/portfolio/lib/homepageSectionNav";
import { hasVisibleServiceTitle } from "@/features/portfolio/lib/serviceKindGroups";
import { getPortfolioData } from "@/services/portfolio";
import { getServiceBySlug } from "@/services/services/queries.server";
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
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Service not found" };
  const title = pickLocalized(locale, service.title, service.title_ar);
  const description = pickLocalized(
    locale,
    service.description,
    service.description_ar,
  );
  return {
    title: title || service.title,
    description: description || service.description || undefined,
    alternates: buildAlternates(locale, `/services/${slug}`, getSiteUrl()),
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;

  const [service, portfolio] = await Promise.all([
    getServiceBySlug(slug),
    getPortfolioData(),
  ]);
  // Not found rather than redirect: unlike case studies / featured
  // projects, a service page has no "homepage anchor" fallback to send a
  // visitor to that still makes sense without the specific service in view.
  if (!service) notFound();
  if (
    !hasVisibleServiceTitle(service.title) ||
    !isSitePageSectionVisible(
      "services",
      portfolio.settings?.homepage_hidden_sections,
    )
  ) {
    notFound();
  }

  const backLabel =
    pickLocalized(
      locale,
      portfolio.settings?.services_title,
      portfolio.settings?.services_title_ar,
    ) || "Services";
  const siteUrl = getSiteUrl();
  const path = localePath(locale, `/services/${slug}`);
  const title = pickLocalized(locale, service.title, service.title_ar);
  const breadcrumb = buildBreadcrumbList(siteUrl, [
    { name: "Home", path: localePath(locale, "/") },
    { name: backLabel, path: localePath(locale, "/#services") },
    { name: title || service.title, path },
  ]);
  const article = buildArticleNode({
    siteUrl,
    path,
    headline: title || service.title,
    description: pickLocalized(
      locale,
      service.description,
      service.description_ar,
    ),
    image: service.image_url,
    datePublished: service.created_at,
    dateModified: service.updated_at,
    authorName: portfolio.settings?.contact_doctor_name || "The Dental Lounge",
    clinicId: `${siteUrl}/#clinic`,
  });

  return (
    <DentalSitePage data={portfolio}>
      <JsonLd graph={wrapGraph([breadcrumb, article])} />
      <div className="mx-auto max-w-[1180px] px-[clamp(1rem,3vw,2.5rem)] pt-8">
        <DentalLocalizedBackLink
          href="/#services"
          label={portfolio.settings?.services_title || "Services"}
          labelAr={portfolio.settings?.services_title_ar}
        />
      </div>
      <ServiceDetailView service={service} />
    </DentalSitePage>
  );
}

import { cookies } from "next/headers";
import { DentalHomePage } from "@/features/portfolio/components/dental/DentalHomePage";
import { getPortfolioData } from "@/services/portfolio";
import { getPublicClinicHours } from "@/services/clinic_schedule/queries.server";
import { buildClinicGraph } from "@/lib/seo/jsonLd";
import { JsonLd } from "@/lib/seo/JsonLdScript";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { LOCALE_COOKIE_KEY, parseLocale } from "@/lib/i18n/localeStorage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPortfolioData();
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo =
    data.settings?.brand_logo_url ??
    "/dental/766800441_18084577118253727_1449914596899119909_n.jpg";

  // Crawlers never send the locale cookie, so they consistently see the
  // English graph, matching the English HTML they're served today.
  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value) ?? "en";
  const hours = await getPublicClinicHours();
  const graph = buildClinicGraph({
    locale,
    siteUrl: getSiteUrl(),
    settings: data.settings,
    hours,
    services: data.services,
  });

  return (
    <>
      <JsonLd graph={graph} />
      <DentalHomePage data={data} brand={brand} brandLogo={brandLogo} />
    </>
  );
}

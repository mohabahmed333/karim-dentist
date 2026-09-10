import { buildLlmsFull } from "@/lib/seo/llmsContent";
import { getPublicClinicHours } from "@/services/clinic_schedule/queries.server";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { getPortfolioData } from "@/services/portfolio";

// TODO(seo-caching): switch to `revalidate` once getPortfolioData/
// getPublicClinicHours are wrapped in unstable_cache — createPublicClient
// hardcodes cache: "no-store", which conflicts with static revalidation and
// forces this route dynamic today, matching every other public route.
export const dynamic = "force-dynamic";

export async function GET() {
  const [portfolio, hours] = await Promise.all([
    getPortfolioData(),
    getPublicClinicHours(),
  ]);

  const body = buildLlmsFull({
    siteUrl: getSiteUrl(),
    settings: portfolio.settings,
    hours,
    services: portfolio.services,
    aboutBody: portfolio.about?.body,
    caseStudies: portfolio.caseStudies,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

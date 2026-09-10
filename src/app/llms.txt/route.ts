import { buildLlmsIndex } from "@/lib/seo/llmsContent";
import { getCachedClinicHours } from "@/services/clinic_schedule/cached";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { getCachedPortfolioData } from "@/services/portfolio/cached";

// Cached: see src/services/portfolio/cached.ts. Purged on admin save via
// notifyRevalidate(["portfolio", "clinic-hours"]).
export const revalidate = 900;

export async function GET() {
  const [portfolio, hours] = await Promise.all([
    getCachedPortfolioData(),
    getCachedClinicHours(),
  ]);

  const body = buildLlmsIndex({
    siteUrl: getSiteUrl(),
    settings: portfolio.settings,
    hours,
    services: portfolio.services,
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

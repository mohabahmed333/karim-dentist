import { buildPublicServicesPayload } from "@/lib/api/publicServicesPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { getCachedPortfolioData } from "@/services/portfolio/cached";

// Cached: see src/services/portfolio/cached.ts. Purged on admin save via
// notifyRevalidate(["portfolio"]).
export const revalidate = 900;

export async function GET() {
  const portfolio = await getCachedPortfolioData();
  return publicJson(
    buildPublicServicesPayload(portfolio.services, getSiteUrl()),
  );
}

export function OPTIONS() {
  return publicJsonOptions();
}

import { buildPublicFaqPayload } from "@/lib/api/publicFaqPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getCachedPortfolioData } from "@/services/portfolio/cached";

// Cached: see src/services/portfolio/cached.ts. Purged on admin save via
// notifyRevalidate(["portfolio"]).
export const revalidate = 900;

export async function GET() {
  const portfolio = await getCachedPortfolioData();
  return publicJson(buildPublicFaqPayload(portfolio.faqs));
}

export function OPTIONS() {
  return publicJsonOptions();
}

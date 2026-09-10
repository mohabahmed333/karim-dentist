import { buildPublicClinicPayload } from "@/lib/api/publicClinicPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getCachedClinicHours } from "@/services/clinic_schedule/cached";
import { getCachedPortfolioData } from "@/services/portfolio/cached";

// Cached: see src/services/portfolio/cached.ts. Purged on admin save via
// notifyRevalidate(["portfolio", "clinic-hours"]).
export const revalidate = 900;

export async function GET() {
  const [portfolio, hours] = await Promise.all([
    getCachedPortfolioData(),
    getCachedClinicHours(),
  ]);
  return publicJson(buildPublicClinicPayload(portfolio.settings, hours));
}

export function OPTIONS() {
  return publicJsonOptions();
}

import { buildPublicClinicPayload } from "@/lib/api/publicClinicPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getPublicClinicHours } from "@/services/clinic_schedule/queries.server";
import { getPortfolioData } from "@/services/portfolio";

// createPublicClient() hardcodes cache: "no-store" — same reason llms.txt
// and sitemap.ts stay dynamic rather than `revalidate` today.
export const dynamic = "force-dynamic";

export async function GET() {
  const [portfolio, hours] = await Promise.all([
    getPortfolioData(),
    getPublicClinicHours(),
  ]);
  return publicJson(buildPublicClinicPayload(portfolio.settings, hours));
}

export function OPTIONS() {
  return publicJsonOptions();
}

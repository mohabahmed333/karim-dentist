import { buildPublicServicesPayload } from "@/lib/api/publicServicesPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const portfolio = await getPortfolioData();
  return publicJson(
    buildPublicServicesPayload(portfolio.services, getSiteUrl()),
  );
}

export function OPTIONS() {
  return publicJsonOptions();
}

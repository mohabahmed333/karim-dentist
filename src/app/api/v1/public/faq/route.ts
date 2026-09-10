import { buildPublicFaqPayload } from "@/lib/api/publicFaqPayload";
import { publicJson, publicJsonOptions } from "@/lib/api/publicJson";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
  const portfolio = await getPortfolioData();
  return publicJson(buildPublicFaqPayload(portfolio.faqs));
}

export function OPTIONS() {
  return publicJsonOptions();
}

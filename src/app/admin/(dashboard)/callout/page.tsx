import { CalloutEditor } from "@/features/admin/components/CalloutEditor";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function AdminCalloutPage() {
  const data = await getPortfolioData();
  return <CalloutEditor callout={data.callout} />;
}

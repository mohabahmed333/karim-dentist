import { CalloutEditor } from "@/features/admin/components/CalloutEditor";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminCalloutPage() {
  await requirePagePermission("callout.view");
  const data = await getPortfolioData();
  return <CalloutEditor callout={data.callout} />;
}

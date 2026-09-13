import { HomepageOrderEditor } from "@/features/admin/components/HomepageOrderEditor";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminHomepageOrderPage() {
  await requirePagePermission("homepage-order.view");
  const data = await getPortfolioData();
  return <HomepageOrderEditor settings={data.settings} />;
}

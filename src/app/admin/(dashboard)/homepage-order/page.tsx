import { HomepageOrderEditor } from "@/features/admin/components/HomepageOrderEditor";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function AdminHomepageOrderPage() {
  const data = await getPortfolioData();
  return <HomepageOrderEditor settings={data.settings} />;
}

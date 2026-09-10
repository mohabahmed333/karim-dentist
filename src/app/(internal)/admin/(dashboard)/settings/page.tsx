import { SettingsEditor } from "@/features/admin/components/SettingsEditor";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const data = await getPortfolioData();
  return <SettingsEditor settings={data.settings} />;
}

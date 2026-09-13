import { SettingsEditor } from "@/features/admin/components/SettingsEditor";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePagePermission("settings.view");
  const data = await getPortfolioData();
  return <SettingsEditor settings={data.settings} />;
}

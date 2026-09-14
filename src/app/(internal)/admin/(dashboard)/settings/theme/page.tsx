import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { SettingsDashboardForm } from "@/features/admin/components/SettingsDashboardForm";
import { Card } from "@/components/ui/card";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsThemePage() {
  await requirePagePermission("settings.view");
  const data = await getPortfolioData();
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.theme" />
      <Card className="max-w-4xl gap-0 p-6">
        <SettingsDashboardForm settings={data.settings} />
      </Card>
    </AdminPageMotion>
  );
}

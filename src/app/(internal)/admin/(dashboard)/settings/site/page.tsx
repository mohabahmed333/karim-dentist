import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { SettingsSiteForm } from "@/features/admin/components/SettingsSiteForm";
import { Card } from "@/components/ui/card";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsSitePage() {
  await requirePagePermission("settings.view");
  const data = await getPortfolioData();
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.brand" />
      <Card className="w-full max-w-none gap-0 p-6">
        <SettingsSiteForm settings={data.settings} />
      </Card>
    </AdminPageMotion>
  );
}

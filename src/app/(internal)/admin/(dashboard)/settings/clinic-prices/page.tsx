import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ChartingFeesEditor } from "@/features/admin/components/ChartingFeesEditor";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsClinicPricesPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.clinic" />
      <Card className="max-w-5xl gap-0 p-6">
        <ChartingFeesEditor />
      </Card>
    </AdminPageMotion>
  );
}

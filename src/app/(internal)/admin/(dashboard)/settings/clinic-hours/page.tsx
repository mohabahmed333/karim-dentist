import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ClinicHoursEditor } from "@/features/admin/components/ClinicHoursEditor";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsClinicHoursPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.hours" />
      <Card className="max-w-3xl gap-0 p-6">
        <ClinicHoursEditor />
      </Card>
    </AdminPageMotion>
  );
}

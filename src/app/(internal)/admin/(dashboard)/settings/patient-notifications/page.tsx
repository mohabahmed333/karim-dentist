import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { NotificationSettingsForm } from "@/features/admin/components/NotificationSettingsForm";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPatientNotificationsPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.notifications" />
      <Card className="max-w-6xl gap-0 p-6">
        <NotificationSettingsForm />
      </Card>
    </AdminPageMotion>
  );
}

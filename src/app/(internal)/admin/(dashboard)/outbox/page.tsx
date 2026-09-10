import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { NotificationsOutboxTable } from "@/features/admin/components/NotificationsOutboxTable";
import { OptOutManager } from "@/features/admin/components/OptOutManager";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AdminOutboxPage() {
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.outbox.title"
        descriptionKey="admin.pages.outbox.description"
      />
      <Card className="gap-0 p-4">
        <NotificationsOutboxTable />
      </Card>
      <Card className="gap-3 p-4">
        <h2 className="text-sm font-medium">Opted out</h2>
        <OptOutManager />
      </Card>
    </AdminPageMotion>
  );
}

import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { SystemActionLog } from "@/features/admin/components/system-log/SystemActionLog";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSystemLogPage() {
  const session = await requirePagePermission("system-log.view");
  const canRevert = session.permissions.has("system-log.revert");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.systemLog.title"
        descriptionKey="admin.pages.systemLog.description"
      />
      <SystemActionLog canRevert={canRevert} />
    </AdminPageMotion>
  );
}

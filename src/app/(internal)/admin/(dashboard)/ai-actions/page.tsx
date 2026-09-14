import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AiActionsLog } from "@/features/admin/components/admin-ai/AiActionsLog";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminAiActionsPage() {
  await requirePagePermission("ai-actions.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.aiActions.title"
        descriptionKey="admin.pages.aiActions.description"
      />
      <AiActionsLog />
    </AdminPageMotion>
  );
}

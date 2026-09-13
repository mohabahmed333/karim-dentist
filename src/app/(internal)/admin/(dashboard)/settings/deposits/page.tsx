import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { DepositSettingsForm } from "@/features/admin/components/DepositSettingsForm";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsDepositsPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.deposits" />
      <Card className="max-w-3xl gap-0 p-6">
        <DepositSettingsForm />
      </Card>
    </AdminPageMotion>
  );
}

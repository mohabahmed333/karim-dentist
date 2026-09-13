import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { DepositSettingsForm } from "@/features/admin/components/DepositSettingsForm";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsDepositsPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      {/* The header lives in the form, which owns the save state it needs. */}
      <div className="max-w-3xl">
        <DepositSettingsForm />
      </div>
    </AdminPageMotion>
  );
}

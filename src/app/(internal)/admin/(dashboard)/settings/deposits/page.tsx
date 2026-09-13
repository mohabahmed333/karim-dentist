import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { DepositSettingsForm } from "@/features/admin/components/DepositSettingsForm";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsDepositsPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      {/* The form owns the header, because it owns the save state that button
          needs — and it spans the page so the action lands on the page's edge,
          keeping its own fields in a narrower column. */}
      <DepositSettingsForm />
    </AdminPageMotion>
  );
}

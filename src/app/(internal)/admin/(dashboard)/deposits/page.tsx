import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { DepositsQueue } from "@/features/admin/components/DepositsQueue";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  await requirePagePermission("reservations.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.deposits.title"
        descriptionKey="admin.pages.deposits.description"
      />
      <DepositsQueue />
    </AdminPageMotion>
  );
}

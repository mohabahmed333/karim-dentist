import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { WaitlistManager } from "@/features/admin/components/WaitlistManager";

export const dynamic = "force-dynamic";

export default function AdminWaitlistPage() {
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.waitlist.title"
        descriptionKey="admin.pages.waitlist.description"
      />
      <WaitlistManager />
    </AdminPageMotion>
  );
}

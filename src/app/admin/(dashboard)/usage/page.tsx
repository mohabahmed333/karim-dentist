import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { UsageDashboard } from "@/features/admin/components/usage/UsageDashboard";
import { getPlatformUsageReport } from "@/services/platform_usage";

export const dynamic = "force-dynamic";

export default async function AdminUsagePage() {
  const data = await getPlatformUsageReport();
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.usage.title"
        descriptionKey="admin.usage.description"
      />
      <UsageDashboard data={data} />
    </AdminPageMotion>
  );
}

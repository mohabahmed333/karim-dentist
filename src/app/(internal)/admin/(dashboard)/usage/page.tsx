import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { UsageDashboard } from "@/features/admin/components/usage/UsageDashboard";
import { getCachedPlatformUsageReport } from "@/services/platform_usage/cached";
import { requirePagePermission } from "@/lib/auth/pageGuard";

// Cached: see src/services/platform_usage/cached.ts.
export const revalidate = 60;

export default async function AdminUsagePage() {
  await requirePagePermission("usage.view");
  const data = await getCachedPlatformUsageReport();
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

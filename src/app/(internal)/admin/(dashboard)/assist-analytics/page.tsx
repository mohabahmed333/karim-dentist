import { createClient } from "@/lib/supabase/server";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { AdminAiAnalyticsDashboard } from "@/features/admin/components/admin-ai/AdminAiAnalyticsDashboard";
import { loadAdminAiAnalytics } from "@/services/admin_ai/loadAdminAiAnalytics";

export const dynamic = "force-dynamic";

export default async function AdminAiAnalyticsPage() {
  const supabase = await createClient();
  const data = await loadAdminAiAnalytics(supabase);
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.aiAnalytics.title"
        descriptionKey="admin.aiAnalytics.description"
      />
      <AdminAiAnalyticsDashboard data={data} />
    </AdminPageMotion>
  );
}

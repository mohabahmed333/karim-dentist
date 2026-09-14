import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ChartingFeesEditor } from "@/features/admin/components/ChartingFeesEditor";
import { ClinicServicePricesSection } from "@/features/admin/components/ClinicServicePricesSection";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPricesPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.clinic" />
      <Card className="max-w-5xl gap-0 p-6">
        <ChartingFeesEditor />
      </Card>
      <Card className="max-w-5xl gap-3 p-6">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-[#1E293B]">Services</h2>
          <p className="text-xs text-[#64748B]">
            The price range patients see for each service — the same range a
            doctor&apos;s own price must stay within.
          </p>
        </div>
        <ClinicServicePricesSection />
      </Card>
    </AdminPageMotion>
  );
}

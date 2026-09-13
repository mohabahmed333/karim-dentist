import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { WhatsappAiSettingsForm } from "@/features/admin/components/WhatsappAiSettingsForm";
import { Card } from "@/components/ui/card";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsWhatsappAiPage() {
  await requirePagePermission("settings.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader titleKey="admin.settings.whatsappAi" />
      <Card className="max-w-3xl gap-0 p-6">
        <WhatsappAiSettingsForm />
      </Card>
    </AdminPageMotion>
  );
}

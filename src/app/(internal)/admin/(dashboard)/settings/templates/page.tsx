import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { RequiredTemplatesList } from "@/features/admin/components/RequiredTemplatesList";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { collectRequiredTemplates } from "@/services/patient_notifications/requiredTemplates";
import { listApprovedTemplateNames } from "@/services/whatsapp/listApprovedTemplateNames";

export const dynamic = "force-dynamic";

export default async function AdminSettingsTemplatesPage() {
  await requirePagePermission("settings.view");

  const approved = await listApprovedTemplateNames();

  return (
    <AdminPageMotion className="space-y-4">
      <div className="space-y-0.5">
        <h1 className="text-lg font-semibold">WhatsApp templates</h1>
        <p className="text-sm text-[var(--admin-muted)]">
          Meta needs an approved template to start a conversation. Replies within
          24 hours of a patient writing need none — only the messages the clinic
          sends first appear here.
        </p>
      </div>
      <RequiredTemplatesList
        rows={collectRequiredTemplates(approved)}
        reachedMeta={approved !== null}
      />
    </AdminPageMotion>
  );
}

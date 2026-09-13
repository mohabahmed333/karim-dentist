import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { AssistantReviewQueue } from "@/features/admin/components/AssistantReviewQueue";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminAssistantReviewPage() {
  await requirePagePermission("assistant-review.view");
  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.assistantReview.title"
        descriptionKey="admin.pages.assistantReview.description"
      />
      <AssistantReviewQueue />
    </AdminPageMotion>
  );
}

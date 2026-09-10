import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { AssistantReviewQueue } from "@/features/admin/components/AssistantReviewQueue";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";

export const dynamic = "force-dynamic";

export default function AdminAssistantReviewPage() {
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

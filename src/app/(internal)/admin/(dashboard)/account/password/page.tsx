import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ChangePasswordForm } from "@/features/admin/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

/**
 * Deliberately has no requirePagePermission: changing your own password is
 * not a privileged action, so every signed-in staff member reaches it
 * regardless of role. A session is all that's required (proxy.ts already
 * enforces that for /admin/*; the check below keeps the page safe on its own).
 */
export default async function AdminChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.changePassword.title"
        descriptionKey="admin.pages.changePassword.description"
      />
      <ChangePasswordForm email={user.email ?? ""} />
    </AdminPageMotion>
  );
}

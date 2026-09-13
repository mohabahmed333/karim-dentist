import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { ProfileForm } from "@/features/admin/components/ProfileForm";

export const dynamic = "force-dynamic";

/**
 * Like the change-password page, this deliberately has no
 * requirePagePermission: maintaining your own details isn't privileged, so
 * every role reaches it. A session is all that's required.
 */
export default async function AdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, phone, job_title, avatar_url, created_at, roles(name)")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.profile.title"
        descriptionKey="admin.pages.profile.description"
      />
      <ProfileForm
        userId={user.id}
        email={user.email ?? null}
        roleName={profile?.roles?.name ?? null}
        memberSince={profile?.created_at ?? null}
        initial={{
          displayName: profile?.display_name ?? null,
          phone: profile?.phone ?? null,
          jobTitle: profile?.job_title ?? null,
          avatarUrl: profile?.avatar_url ?? null,
        }}
      />
    </AdminPageMotion>
  );
}

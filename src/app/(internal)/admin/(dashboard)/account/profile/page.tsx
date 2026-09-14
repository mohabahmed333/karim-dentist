import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listServedPatients } from "@/services/profiles/servedPatients";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
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

  const [{ data: profile }, patients] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, phone, job_title, avatar_url, specialty, bio, calendar_color, created_at, updated_at, deleted_at, roles(name, is_doctor)",
      )
      .eq("id", user.id)
      .maybeSingle(),
    listServedPatients(supabase, user.id).catch(() => []),
  ]);

  return (
    <AdminPageMotion className="space-y-4">
      <ProfileForm
        userId={user.id}
        email={user.email ?? null}
        roleName={profile?.roles?.name ?? null}
        memberSince={profile?.created_at ?? null}
        lastUpdated={profile?.updated_at ?? null}
        isActive={!profile?.deleted_at}
        isDoctor={Boolean(profile?.roles?.is_doctor)}
        patients={patients}
        initial={{
          displayName: profile?.display_name ?? null,
          phone: profile?.phone ?? null,
          jobTitle: profile?.job_title ?? null,
          avatarUrl: profile?.avatar_url ?? null,
          specialty: profile?.specialty ?? null,
          bio: profile?.bio ?? null,
          calendarColor: profile?.calendar_color ?? null,
        }}
      />
    </AdminPageMotion>
  );
}

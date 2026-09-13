import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

/** The fields a staff member may change about themselves. */
export type ProfileDetailsInput = {
  display_name: string | null;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
};

/**
 * Descriptive fields only — role, role_id and deleted_at are deliberately not
 * writable here. The database enforces the same rule for non-admins via the
 * profiles_guard_self_update trigger.
 */
export async function updateProfileDetails(
  supabase: AnySupabase,
  id: string,
  input: ProfileDetailsInput,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name,
      phone: input.phone,
      job_title: input.job_title,
      avatar_url: input.avatar_url,
      // profiles has no auto-touch trigger, so bump it explicitly.
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

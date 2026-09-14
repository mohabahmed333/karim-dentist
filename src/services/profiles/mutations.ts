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
  specialty: string | null;
  bio: string | null;
  calendar_color: string | null;
};

/**
 * Descriptive fields only — role, role_id and deleted_at are deliberately not
 * writable here. The database enforces the same rule for non-admins via the
 * profiles_guard_self_update trigger. specialty/bio/calendar_color are only
 * meaningful for doctor accounts, but harmless to send for anyone else.
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
      specialty: input.specialty,
      bio: input.bio,
      calendar_color: input.calendar_color,
      // profiles has no auto-touch trigger, so bump it explicitly.
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Admin-side edit of another user's doctor identity fields. Deliberately
 * narrower than updateProfileDetails — only touches specialty/bio/color, so
 * it can't clobber the doctor's own display_name/phone/job_title.
 */
export async function updateDoctorIdentity(
  supabase: AnySupabase,
  doctorId: string,
  input: { specialty: string | null; bio: string | null; calendar_color: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      specialty: input.specialty,
      bio: input.bio,
      calendar_color: input.calendar_color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", doctorId);
  if (error) throw error;
}

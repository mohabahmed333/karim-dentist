import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { createServiceClient } from "@/lib/supabase/service";

type AnySupabase =
  | ReturnType<typeof createServiceClient>
  | Awaited<ReturnType<typeof createBrowserClient>>
  | Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export type StaffProfile = {
  id: string;
  display_name: string | null;
};

export async function listStaffProfiles(
  supabase: AnySupabase,
): Promise<StaffProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("role", "admin")
    .is("deleted_at", null)
    .order("display_name", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export type DoctorProfile = {
  id: string;
  display_name: string | null;
  specialty: string | null;
  bio: string | null;
  avatar_url: string | null;
  calendar_color: string | null;
};

/** Staff accounts whose role is flagged `is_doctor` — the assignable doctors. */
export async function listDoctors(
  supabase: AnySupabase,
): Promise<DoctorProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, specialty, bio, avatar_url, calendar_color, roles!inner(is_doctor)",
    )
    .eq("roles.is_doctor", true)
    .is("deleted_at", null)
    .order("display_name", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    display_name: row.display_name,
    specialty: row.specialty,
    bio: row.bio,
    avatar_url: row.avatar_url,
    calendar_color: row.calendar_color,
  }));
}

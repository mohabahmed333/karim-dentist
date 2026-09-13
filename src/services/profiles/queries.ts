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

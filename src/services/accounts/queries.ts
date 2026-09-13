import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type StaffAccount = {
  id: string;
  email: string | null;
  display_name: string | null;
  role_id: string | null;
  role_key: string | null;
  role_name: string | null;
  deleted_at: string | null;
  created_at: string;
};

export async function listAccounts(
  supabase: ServerSupabase,
): Promise<StaffAccount[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, role_id, deleted_at, created_at, roles(key, name)",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    email: null,
    display_name: row.display_name,
    role_id: row.role_id,
    role_key: row.roles?.key ?? null,
    role_name: row.roles?.name ?? null,
    deleted_at: row.deleted_at,
    created_at: row.created_at,
  }));
}

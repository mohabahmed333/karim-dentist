import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_admin_role: boolean;
  is_system: boolean;
  is_doctor: boolean;
};

export type Permission = {
  id: string;
  key: string;
  category: string;
  label: string;
  sort_order: number;
};

export async function listRoles(supabase: ServerSupabase): Promise<Role[]> {
  const { data, error } = await supabase
    .from("roles")
    .select("id, key, name, description, is_admin_role, is_system, is_doctor")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listPermissions(
  supabase: ServerSupabase,
): Promise<Permission[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("id, key, category, label, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRolePermissionKeys(
  supabase: ServerSupabase,
  roleId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permissions(key)")
    .eq("role_id", roleId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.permissions?.key)
    .filter((key): key is string => Boolean(key));
}

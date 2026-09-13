import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type CreateRoleInput = {
  key: string;
  name: string;
  description?: string;
  isAdminRole: boolean;
};

export async function createRole(
  supabase: ServerSupabase,
  input: CreateRoleInput,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("roles")
    .insert({
      key: input.key,
      name: input.name,
      description: input.description ?? null,
      is_admin_role: input.isAdminRole,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function updateRoleDetails(
  supabase: ServerSupabase,
  roleId: string,
  input: { name: string; description?: string },
): Promise<void> {
  const { error } = await supabase
    .from("roles")
    .update({ name: input.name, description: input.description ?? null })
    .eq("id", roleId);
  if (error) throw error;
}

/** Replace-all: clears the role's current grants and inserts the new set. */
export async function updateRolePermissions(
  supabase: ServerSupabase,
  roleId: string,
  permissionKeys: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);
  if (deleteError) throw deleteError;

  if (permissionKeys.length === 0) return;

  const { data: permissions, error: lookupError } = await supabase
    .from("permissions")
    .select("id, key")
    .in("key", permissionKeys);
  if (lookupError) throw lookupError;

  const { error: insertError } = await supabase.from("role_permissions").insert(
    (permissions ?? []).map((permission) => ({
      role_id: roleId,
      permission_id: permission.id,
    })),
  );
  if (insertError) throw insertError;
}

export async function deleteRole(
  supabase: ServerSupabase,
  roleId: string,
): Promise<void> {
  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("is_system")
    .eq("id", roleId)
    .single();
  if (roleError) throw roleError;
  if (role.is_system) {
    throw new Error("System roles cannot be deleted");
  }

  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", roleId);
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new Error("Cannot delete a role assigned to an account");
  }

  const { error } = await supabase.from("roles").delete().eq("id", roleId);
  if (error) throw error;
}

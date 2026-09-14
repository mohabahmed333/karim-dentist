/**
 * Fine-grained permission resolution, layered on top of the coarse
 * admin/viewer `is_admin()` check in `@/lib/api/adminAccess`.
 *
 * Fails closed: any missing/deleted profile, unassigned role, or query error
 * yields an empty permission set rather than throwing or defaulting open.
 */

import type { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email?: string | null;
};

export type DashboardScope = "clinic" | "own";

export type SessionPermissions = {
  user: SessionUser | null;
  isAdmin: boolean;
  isDoctor: boolean;
  dashboardScope: DashboardScope;
  roleId: string | null;
  roleKey: string | null;
  permissions: Set<string>;
};

/** `SessionPermissions` with `user` narrowed to non-null, for the authorized-request path. */
export type AuthorizedSession = SessionPermissions & { user: SessionUser };

const EMPTY: Omit<SessionPermissions, "user"> = {
  isAdmin: false,
  isDoctor: false,
  dashboardScope: "clinic",
  roleId: null,
  roleKey: null,
  permissions: new Set(),
};

export async function resolveSessionPermissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<SessionPermissions> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, ...EMPTY };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role_id, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.deleted_at || !profile.role_id) {
    return { user, ...EMPTY };
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, key, is_admin_role, is_doctor, dashboard_scope, deleted_at")
    .eq("id", profile.role_id)
    .maybeSingle();

  if (roleError || !role || role.deleted_at) {
    return { user, ...EMPTY };
  }

  const dashboardScope: DashboardScope =
    role.dashboard_scope === "own" ? "own" : "clinic";

  const { data: rolePermissions, error: permissionsError } = await supabase
    .from("role_permissions")
    .select("permissions(key)")
    .eq("role_id", role.id);

  if (permissionsError || !rolePermissions) {
    return {
      user,
      isAdmin: role.is_admin_role,
      isDoctor: role.is_doctor,
      dashboardScope,
      roleId: role.id,
      roleKey: role.key,
      permissions: new Set(),
    };
  }

  const permissions = new Set(
    rolePermissions
      .map((row) => row.permissions?.key)
      .filter((key): key is string => Boolean(key)),
  );

  return {
    user,
    isAdmin: role.is_admin_role,
    isDoctor: role.is_doctor,
    dashboardScope,
    roleId: role.id,
    roleKey: role.key,
    permissions,
  };
}

export function hasPermission(
  session: SessionPermissions,
  key: string,
): boolean {
  return session.permissions.has(key);
}

import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import {
  getRolePermissionKeys,
  listPermissions,
  listRoles,
} from "@/services/roles/queries";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { RolesManager } from "@/features/admin/components/roles/RolesManager";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requirePagePermission("roles.view");

  const supabase = await createClient();
  const [roles, permissions] = await Promise.all([
    listRoles(supabase),
    listPermissions(supabase),
  ]);

  const rolePermissions = Object.fromEntries(
    await Promise.all(
      roles.map(async (role) => [
        role.id,
        await getRolePermissionKeys(supabase, role.id),
      ]),
    ),
  );

  return (
    <AdminPageMotion className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Roles &amp; permissions</h1>
        <p className="text-sm text-muted-foreground">
          Create roles and choose exactly which pages and actions each one
          can use.
        </p>
      </div>
      <RolesManager
        initialRoles={roles}
        permissions={permissions}
        initialRolePermissions={rolePermissions}
      />
    </AdminPageMotion>
  );
}

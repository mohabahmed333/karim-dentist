"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { listRoles, type Role } from "./queries";

/** Only what's needed to populate a role picker (e.g. Add Doctor) client-side. */
export async function listRolesAction(): Promise<Role[]> {
  const auth = await requirePermission("accounts.create");
  if (auth.error) throw new Error("Forbidden");
  return listRoles(auth.supabase);
}

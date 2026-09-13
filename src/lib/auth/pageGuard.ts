import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveSessionPermissions, hasPermission } from "@/lib/auth/permissions";

/**
 * Gate an admin Server Component page on a permission key.
 *
 * Unauthenticated users are redirected to login (middleware should already
 * catch this, but pages stay safe if hit directly). Authenticated users
 * missing the permission get a 404 rather than a 403 page, so restricted
 * pages don't reveal their own existence.
 */
export async function requirePagePermission(key: string) {
  const supabase = await createClient();
  const session = await resolveSessionPermissions(supabase);

  if (!session.user) {
    redirect("/admin/login");
  }

  if (!hasPermission(session, key)) {
    notFound();
  }

  return session;
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  resolveSessionPermissions,
  hasPermission,
  type SessionPermissions,
} from "@/lib/auth/permissions";

/**
 * Gate a route handler (or server action) on a specific permission key.
 *
 * Returns 401 when nobody is signed in and 403 when the signed-in user's
 * role doesn't grant `key`. Mirrors `requireAdmin`'s return shape so call
 * sites migrate with a one-line swap.
 */
export async function requirePermission(key: string) {
  const supabase = await createClient();
  const session = await resolveSessionPermissions(supabase);

  if (!session.user) {
    return {
      supabase,
      session: null as SessionPermissions | null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!hasPermission(session, key)) {
    return {
      supabase,
      session: null as SessionPermissions | null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase, session, error: null };
}

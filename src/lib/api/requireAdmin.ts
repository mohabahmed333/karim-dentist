import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAdminAccess, type ProfileQueryClient } from "./adminAccess";

/**
 * Gate a route handler on an authenticated **admin**.
 *
 * Returns 401 when nobody is signed in and 403 when a signed-in user is not an
 * admin. The distinction matters: several routes act through the service-role
 * client, which bypasses RLS entirely, so this check is the only thing standing
 * between a self-signed-up user and clinic data.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { user, isAdmin } = await resolveAdminAccess(
    supabase as unknown as ProfileQueryClient,
  );

  if (!user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdmin) {
    return {
      supabase,
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { supabase, user, error: null };
}

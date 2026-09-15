"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { upsertDashboardLayout } from "./mutations";

/** Same gate Overview's own layout save already goes through. */
export async function saveDashboardLayout(
  pageKey: string,
  layout: unknown,
): Promise<unknown> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return upsertDashboardLayout(auth.supabase, pageKey, layout);
}

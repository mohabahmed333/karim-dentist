import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Thin wrapper so API routes never call db.rpc directly. */
export async function revertSystemAction(
  db: SupabaseClient<Database>,
  logId: string,
): Promise<void> {
  const { error } = await db.rpc("revert_system_action", { p_log_id: logId });
  if (error) throw new Error(error.message);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** The signed-in admin's own client — every tool query runs under their RLS. */
export type ToolDb = SupabaseClient<Database>;

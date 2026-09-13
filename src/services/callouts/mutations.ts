import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type Callout = Tables<"callouts">;
export type CalloutUpdate = TablesUpdate<"callouts">;

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function updateCallout(
  supabase: AnySupabase,
  id: string,
  payload: CalloutUpdate,
): Promise<Callout> {
  const { data, error } = await supabase
    .from("callouts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

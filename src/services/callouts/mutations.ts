import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type Callout = Tables<"callouts">;
export type CalloutUpdate = TablesUpdate<"callouts">;

export async function updateCallout(
  id: string,
  payload: CalloutUpdate,
): Promise<Callout> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("callouts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

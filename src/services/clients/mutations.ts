import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Client, ClientInsert, ClientUpdate } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createClientRow(
  supabase: AnySupabase,
  payload: ClientInsert,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  supabase: AnySupabase,
  id: string,
  payload: ClientUpdate,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteClient(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

import { createClient } from "@/lib/supabase/client";
import type { Client, ClientInsert, ClientUpdate } from "./types";

export async function createClientRow(payload: ClientInsert): Promise<Client> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  id: string,
  payload: ClientUpdate,
): Promise<Client> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clients")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteClient(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

import { createClient } from "@/lib/supabase/client";
import type { Service, ServiceInsert, ServiceUpdate } from "./types";

export async function createService(payload: ServiceInsert): Promise<Service> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  payload: ServiceUpdate,
): Promise<Service> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

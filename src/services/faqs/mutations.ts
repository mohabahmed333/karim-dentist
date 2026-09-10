import { createClient } from "@/lib/supabase/client";
import type { Faq, FaqInsert, FaqUpdate } from "./types";

export async function createFaq(payload: FaqInsert): Promise<Faq> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("faqs")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFaq(id: string, payload: FaqUpdate): Promise<Faq> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("faqs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFaq(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("faqs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

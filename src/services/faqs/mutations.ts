import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Faq, FaqInsert, FaqUpdate } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createFaq(
  supabase: AnySupabase,
  payload: FaqInsert,
): Promise<Faq> {
  const { data, error } = await supabase
    .from("faqs")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFaq(
  supabase: AnySupabase,
  id: string,
  payload: FaqUpdate,
): Promise<Faq> {
  const { data, error } = await supabase
    .from("faqs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFaq(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("faqs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

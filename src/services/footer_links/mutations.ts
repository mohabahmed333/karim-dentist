import { createClient } from "@/lib/supabase/client";
import type { FooterLink, FooterLinkInsert, FooterLinkUpdate } from "./types";

export async function createFooterLink(
  payload: FooterLinkInsert,
): Promise<FooterLink> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("footer_links")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFooterLink(
  id: string,
  payload: FooterLinkUpdate,
): Promise<FooterLink> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("footer_links")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFooterLink(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("footer_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

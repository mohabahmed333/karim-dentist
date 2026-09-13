import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { FooterLink, FooterLinkInsert, FooterLinkUpdate } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createFooterLink(
  supabase: AnySupabase,
  payload: FooterLinkInsert,
): Promise<FooterLink> {
  const { data, error } = await supabase
    .from("footer_links")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFooterLink(
  supabase: AnySupabase,
  id: string,
  payload: FooterLinkUpdate,
): Promise<FooterLink> {
  const { data, error } = await supabase
    .from("footer_links")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFooterLink(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("footer_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

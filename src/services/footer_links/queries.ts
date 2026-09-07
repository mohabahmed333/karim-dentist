import { createClient } from "@/lib/supabase/client";
import type { FooterLink } from "./types";

export async function listFooterLinks(): Promise<FooterLink[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("footer_links")
    .select("*")
    .is("deleted_at", null)
    .order("column_key", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

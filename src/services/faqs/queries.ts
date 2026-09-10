import { createClient } from "@/lib/supabase/client";
import type { Faq } from "./types";

export async function listPublishedFaqs(): Promise<Faq[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

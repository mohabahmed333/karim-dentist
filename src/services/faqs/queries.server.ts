import { createPublicClient } from "@/lib/supabase/public";
import type { Faq } from "./types";

export async function listPublicFaqs(): Promise<Faq[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

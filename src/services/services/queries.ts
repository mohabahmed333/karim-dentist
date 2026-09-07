import { createClient } from "@/lib/supabase/client";
import type { Service } from "./types";

export async function listPublishedServices(): Promise<Service[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .is("deleted_at", null)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

import { createPublicClient } from "@/lib/supabase/public";
import type { Service } from "./types";

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

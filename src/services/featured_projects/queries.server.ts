import { createPublicClient } from "@/lib/supabase/public";
import type { FeaturedProject } from "./types";

export async function getFeaturedBySlug(
  slug: string,
): Promise<FeaturedProject | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("featured_projects")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

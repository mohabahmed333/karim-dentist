import { createClient } from "@/lib/supabase/client";
import { slugifyTitle, withSlugSuffix } from "./slug";

export async function isFeaturedSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = createClient();
  let query = supabase
    .from("featured_projects")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function resolveFeaturedUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugifyTitle(title) || "featured";
  let suffix = 1;
  while (await isFeaturedSlugTaken(withSlugSuffix(base, suffix), excludeId)) {
    suffix += 1;
  }
  return withSlugSuffix(base, suffix);
}

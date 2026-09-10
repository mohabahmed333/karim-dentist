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

export async function isSlugTaken(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = createClient();
  let query = supabase
    .from("services")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function resolveUniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const { slugifyTitle, withSlugSuffix } = await import("./slug");
  const base = slugifyTitle(title) || "service";
  let suffix = 1;
  while (await isSlugTaken(withSlugSuffix(base, suffix), excludeId)) {
    suffix += 1;
  }
  return withSlugSuffix(base, suffix);
}

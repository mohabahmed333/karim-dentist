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

export type ServicePriceRow = {
  id: string;
  title: string;
  price_min_egp: number | null;
  price_max_egp: number | null;
};

/**
 * Every non-deleted service's price range, for the Clinic Prices admin
 * page — not filtered by is_published, same reasoning as the Doctors
 * settings page: staff should be able to set a price before a service goes
 * live, not only after.
 */
export async function listServicesForPricing(): Promise<ServicePriceRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, title, price_min_egp, price_max_egp")
    .is("deleted_at", null)
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

import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Service, ServiceInsert, ServiceUpdate } from "./types";
import { resolveUniqueSlug } from "./queries";
import { isBlankSlug } from "./slug";
import { formatPriceRangeLabel } from "@/services/service_doctors/pricing";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

/**
 * price_label is generated, never hand-typed — the one place that happens.
 * Only touches it when the caller is actually setting a price (both bounds
 * present in the payload, even if null); a payload that doesn't mention
 * price at all leaves whatever price_label is already stored untouched.
 */
function withGeneratedPriceLabel<
  T extends {
    price_min_egp?: number | null;
    price_max_egp?: number | null;
    price_label?: string | null;
  },
>(payload: T): T {
  if (!("price_min_egp" in payload) || !("price_max_egp" in payload)) {
    return payload;
  }
  return {
    ...payload,
    price_label: formatPriceRangeLabel(
      payload.price_min_egp ?? null,
      payload.price_max_egp ?? null,
    ),
  };
}

export async function createService(
  supabase: AnySupabase,
  payload: ServiceInsert,
): Promise<Service> {
  const slug = isBlankSlug(payload.slug)
    ? await resolveUniqueSlug(payload.title)
    : payload.slug;
  const { data, error } = await supabase
    .from("services")
    .insert(withGeneratedPriceLabel({ ...payload, slug }))
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  supabase: AnySupabase,
  id: string,
  payload: ServiceUpdate,
): Promise<Service> {
  const next: ServiceUpdate = withGeneratedPriceLabel({
    ...payload,
    updated_at: new Date().toISOString(),
  });
  if (isBlankSlug(payload.slug)) {
    const { data: existing, error: readError } = await supabase
      .from("services")
      .select("slug, title")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    next.slug = isBlankSlug(existing.slug)
      ? await resolveUniqueSlug(payload.title ?? existing.title, id)
      : existing.slug;
  }
  const { data, error } = await supabase
    .from("services")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteService(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

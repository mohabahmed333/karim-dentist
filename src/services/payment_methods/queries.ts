import type { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/client";
import type { PaymentMethod } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createClient>;

export async function listPaymentMethods(
  supabase: AnySupabase,
): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .is("deleted_at", null)
    .order("kind", { ascending: true })
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Browser-side variant for the settings form's own refreshes. */
export async function listPaymentMethodsClient(): Promise<PaymentMethod[]> {
  return listPaymentMethods(createClient());
}

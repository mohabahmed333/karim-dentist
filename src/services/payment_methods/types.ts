import type { Tables } from "@/lib/supabase/database.types";

export type PaymentMethod = Tables<"payment_methods">;
export type PaymentMethodKind = "instapay" | "wallet";

export const PAYMENT_METHOD_KINDS: readonly PaymentMethodKind[] = [
  "instapay",
  "wallet",
] as const;

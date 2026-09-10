import { createClient } from "@/lib/supabase/client";
import type { ClinicKnowledge } from "./types";

export async function listClinicKnowledge(): Promise<ClinicKnowledge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_knowledge")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

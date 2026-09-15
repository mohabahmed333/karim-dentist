import { createClient } from "@/lib/supabase/client";
import type { AdminNote } from "./types";

export async function listActiveAdminNotes(): Promise<AdminNote[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_notes")
    .select("id, content, color, created_by, created_at, updated_at")
    .is("dismissed_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

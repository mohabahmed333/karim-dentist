import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/** The raw saved layout JSON for a page, or null if nothing's been saved yet. */
export async function getDashboardLayout(
  supabase: ServerSupabase,
  pageKey: string,
): Promise<unknown> {
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .select("layout")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) throw error;
  return data?.layout ?? null;
}

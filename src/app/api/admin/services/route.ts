import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { sanitizeIlike } from "@/services/reservations/listFilters";

export const dynamic = "force-dynamic";

/** Debounced service picker search. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qRaw = (searchParams.get("q") ?? "").trim();
  const q = sanitizeIlike(qRaw);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? 40) || 40),
  );

  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = auth.supabase;

  let query = supabase
    .from("services")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (q) {
    query = query.or(`title.ilike.%${q}%,title_ar.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

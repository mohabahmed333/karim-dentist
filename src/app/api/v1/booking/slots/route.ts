import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? new Date().toISOString();
  const toParam = searchParams.get("to");
  const to =
    toParam ??
    new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .select("id, starts_at, ends_at, status")
    .in("status", ["open", "booked"])
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(400);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data ?? [] });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { waitlistEntrySchema } from "@/services/waitlist/schemas";

export const runtime = "nodejs";

/** Everyone still waiting or holding an offer, longest-waiting first. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { data, error } = await createServiceClient()
    .from("appointment_waitlist")
    .select("*")
    .in("status", ["waiting", "offered"])
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = waitlistEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid entry" },
      { status: 400 },
    );
  }
  const { data, error } = await createServiceClient()
    .from("appointment_waitlist")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data }, { status: 201 });
}

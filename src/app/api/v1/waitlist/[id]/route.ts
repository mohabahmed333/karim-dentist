import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Take someone off the waitlist. A status change rather than a delete, so any
 * offer already queued for them can still be traced back.
 */
export async function DELETE(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const db = createServiceClient();

  const { error } = await db
    .from("appointment_waitlist")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Withdraw any offer not yet sent, so a removed patient is never messaged.
  await db
    .from("patient_notifications")
    .update({ status: "superseded", updated_at: new Date().toISOString() })
    .eq("waitlist_id", id)
    .eq("status", "pending");

  return NextResponse.json({ ok: true });
}

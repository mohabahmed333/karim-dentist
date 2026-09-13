import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** Mark that somebody has rung the patient about a low score. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await // Acting on the review queue, which is what this is.
  requirePermission("assistant-review.approve");
  if (auth.error) return auth.error;

  const { id } = await params;
  const { error } = await createServiceClient()
    .from("visit_ratings")
    .update({
      needs_call: false,
      called_at: new Date().toISOString(),
      called_by: auth.session?.user?.id ?? null,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

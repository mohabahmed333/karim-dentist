import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { removeOptOut } from "@/services/patient_notifications/optouts";

export const runtime = "nodejs";

type Params = { params: Promise<{ suffix: string }> };

/** Let a patient hear from the clinic again. Only when they have asked to. */
export async function DELETE(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { suffix } = await context.params;
  if (!/^\d{1,8}$/.test(suffix)) {
    return NextResponse.json({ error: "Invalid phone suffix" }, { status: 400 });
  }
  try {
    await removeOptOut(createServiceClient(), suffix);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

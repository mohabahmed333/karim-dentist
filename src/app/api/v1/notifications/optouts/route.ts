import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { addOptOut, listOptOuts } from "@/services/patient_notifications/optouts";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone: z.string().trim().min(6).max(40),
  reason: z.string().trim().max(200).optional().default("added by staff"),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json({ optouts: await listOptOuts(createServiceClient()) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  }
  try {
    const suffix = await addOptOut(createServiceClient(), parsed.data.phone, parsed.data.reason);
    return NextResponse.json({ ok: true, phone_suffix: suffix }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}

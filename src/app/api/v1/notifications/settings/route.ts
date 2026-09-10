import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { gatherReadinessFacts } from "@/services/patient_notifications/gatherReadiness";
import { evaluateReadiness } from "@/services/patient_notifications/readiness";

export const runtime = "nodejs";

const patchSchema = z.object({
  mode: z.enum(["off", "dry_run", "send"]).optional(),
  quiet_hours_start: z.number().int().min(0).max(23).optional(),
  quiet_hours_end: z.number().int().min(0).max(23).optional(),
  max_per_patient_per_day: z.number().int().min(0).max(20).optional(),
  reminder_lead_minutes: z.number().int().min(60).max(10080).optional(),
  recall_enabled: z.boolean().optional(),
});

async function loadSettings(service: ReturnType<typeof createServiceClient>) {
  const { data } = await service
    .from("patient_notification_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ settings: await loadSettings(createServiceClient()) });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  // Refuse to arm the flag while something required is missing. Turning it on
  // in that state produces silence rather than errors, which is precisely the
  // failure this screen exists to prevent.
  if (parsed.data.mode === "send") {
    const readiness = evaluateReadiness(await gatherReadinessFacts(service));
    if (!readiness.canSend) {
      return NextResponse.json(
        {
          error: "Cannot switch on sending yet",
          code: "NOT_READY",
          blocking: readiness.blocking,
        },
        { status: 409 },
      );
    }
  }

  const current = await loadSettings(service);
  if (!current) {
    return NextResponse.json({ error: "Settings row is missing" }, { status: 500 });
  }

  const { error } = await service
    .from("patient_notification_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", current.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ settings: await loadSettings(service) });
}

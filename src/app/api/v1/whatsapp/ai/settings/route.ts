import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { loadAiSettings } from "@/services/whatsapp_ai/store";

export const runtime = "nodejs";

const patchSchema = z.object({
  mode: z.enum(["off", "draft_only", "auto"]).optional(),
  max_replies_per_conversation_per_hour: z.number().int().min(0).max(60).optional(),
  max_replies_global_per_hour: z.number().int().min(0).max(5000).optional(),
  human_handoff_minutes: z.number().int().min(0).max(1440).optional(),
  allow_booking_writes: z.boolean().optional(),
  ack_media_enabled: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ settings: await loadAiSettings(createServiceClient()) });
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
  const current = await loadAiSettings(service);
  const { error } = await service
    .from("whatsapp_ai_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", current.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ settings: await loadAiSettings(service) });
}

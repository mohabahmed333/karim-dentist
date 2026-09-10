import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { loadConversationState } from "@/services/whatsapp_ai/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  enabled: z.boolean().optional(),
  /** Minutes to pause the bot for; 0 clears the pause. */
  pauseMinutes: z.number().int().min(0).max(1440).optional(),
});

/** Current per-conversation kill switch / pause state. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const conversationId = new URL(request.url).searchParams.get(
    "conversationId",
  );
  const parsed = z.string().uuid().safeParse(conversationId);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
  }

  const state = await loadConversationState(createServiceClient(), parsed.data);
  return NextResponse.json({ state });
}

/** Per-conversation kill switch and pause. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { conversationId, enabled, pauseMinutes } = parsed.data;
  const service = createServiceClient();
  const { error } = await service.from("whatsapp_ai_state").upsert(
    {
      conversation_id: conversationId,
      ...(enabled === undefined ? {} : { autoreply_enabled: enabled }),
      ...(pauseMinutes === undefined
        ? {}
        : {
            paused_until:
              pauseMinutes > 0
                ? new Date(Date.now() + pauseMinutes * 60_000).toISOString()
                : null,
          }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

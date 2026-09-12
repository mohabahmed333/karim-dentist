import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { recordDraftOutcome } from "@/services/whatsapp_ai/recordCorrection";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { sendWhatsappMessage, WhatsappSessionClosedError } from "@/services/whatsapp/sendMessage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  /** Present = approve and send (optionally edited). Absent = edit only. */
  send: z.boolean().optional().default(false),
  text: z.string().trim().min(1).max(4000).optional(),
});

async function loadDraft(service: ReturnType<typeof createServiceClient>, id: string) {
  const { data } = await service
    .from("whatsapp_messages")
    .select("id,conversation_id,body,status,flow")
    .eq("id", id)
    .eq("status", "draft")
    .maybeSingle();
  return data;
}

/**
 * The reply buttons the assistant composed with this draft.
 *
 * Read back defensively: the column is free-form JSON written by several code
 * paths, and a malformed value must cost the buttons, never the send.
 */
function draftButtons(flow: unknown): { id: string; title: string }[] | undefined {
  if (!flow || typeof flow !== "object") return undefined;
  const raw = (flow as { buttons?: unknown }).buttons;
  if (!Array.isArray(raw)) return undefined;
  const buttons = raw.filter(
    (button): button is { id: string; title: string } =>
      Boolean(button) &&
      typeof button === "object" &&
      typeof (button as { id?: unknown }).id === "string" &&
      typeof (button as { title?: unknown }).title === "string",
  );
  return buttons.length > 0 ? buttons : undefined;
}

/** Edit a draft, or approve and send it. */
export async function PATCH(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const service = createServiceClient();
  const draft = await loadDraft(service, id);
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const text = parsed.data.text ?? draft.body;

  if (!parsed.data.send) {
    await service.from("whatsapp_messages").update({ body: text }).eq("id", id);
    return NextResponse.json({ ok: true, status: "draft" });
  }

  try {
    const config = getKapsoConfig();
    const sent = await sendWhatsappMessage({
      service,
      client: createKapsoClient(),
      phoneNumberId: config.phoneNumberId,
      conversationId: draft.conversation_id,
      // The approving admin owns the send, even though the AI wrote it. That
      // pairing is the provenance staff need when reviewing later.
      sentBy: auth.user!.id,
      // Recorded as AI, not human: approving a draft is a person endorsing the
      // assistant, not taking the conversation over. Marking it human tripped
      // the handoff guard, so approving a draft silenced the bot for the next
      // 30 minutes — the opposite of what approval should mean. It still counts
      // toward the AI rate limit, which is correct.
      senderKind: "ai",
      text,
      // Approving endorses the whole message, buttons included.
      buttons: draftButtons(draft.flow),
    });
    // Capture what the assistant proposed against what staff actually sent,
    // before the draft disappears. This is the only moment both exist.
    await recordDraftOutcome(service, {
      conversationId: draft.conversation_id,
      sentText: text,
      sentBy: auth.user?.id ?? null,
    });
    // The send inserted the real message; drop the draft placeholder.
    await service.from("whatsapp_messages").delete().eq("id", id);
    return NextResponse.json({ ok: true, message: sent });
  } catch (err) {
    if (err instanceof WhatsappSessionClosedError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 502 },
    );
  }
}

/** Discard a draft without sending. */
export async function DELETE(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const service = createServiceClient();
  const { error } = await service
    .from("whatsapp_messages")
    .delete()
    .eq("id", id)
    .eq("status", "draft");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

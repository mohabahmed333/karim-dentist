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
function draftChoices(flow: unknown): {
  buttons?: { id: string; title: string }[];
  list?: { button: string; rows: { id: string; title: string; description?: string }[] };
} {
  if (!flow || typeof flow !== "object") return {};
  const payload = flow as {
    kind?: unknown;
    title?: unknown;
    buttons?: unknown;
    rows?: unknown;
  };

  const choices = (raw: unknown) =>
    Array.isArray(raw)
      ? raw.filter(
          (row): row is { id: string; title: string; description?: string } =>
            Boolean(row) &&
            typeof row === "object" &&
            typeof (row as { id?: unknown }).id === "string" &&
            typeof (row as { title?: unknown }).title === "string",
        )
      : [];

  if (payload.kind === "list") {
    const rows = choices(payload.rows).length ? choices(payload.rows) : choices(payload.buttons);
    const button = typeof payload.title === "string" ? payload.title : "";
    return rows.length > 0 && button ? { list: { button, rows } } : {};
  }

  const buttons = choices(payload.buttons).map(({ id, title }) => ({ id, title }));
  return buttons.length > 0 ? { buttons } : {};
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
      // Approving endorses the whole message, choices included.
      ...draftChoices(draft.flow),
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

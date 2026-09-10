import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import {
  clearConversationUnread,
  getConversation,
  listMessages,
} from "@/services/whatsapp";

export const runtime = "nodejs";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const service = createServiceClient();
    const conversation = await getConversation(
      service,
      parsed.data.conversationId,
    );
    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const messages = await listMessages(service, conversation.id);
    const latestInbound = [...messages]
      .reverse()
      .find((m) => m.direction === "inbound" && m.kapso_wamid);

    if (latestInbound?.kapso_wamid) {
      const { phoneNumberId } = getKapsoConfig();
      const client = createKapsoClient();
      await client.messages.markRead({
        phoneNumberId,
        messageId: latestInbound.kapso_wamid,
      });
    }

    await clearConversationUnread(service, conversation.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/read]", error);
    return NextResponse.json({ error: "Read failed" }, { status: 500 });
  }
}

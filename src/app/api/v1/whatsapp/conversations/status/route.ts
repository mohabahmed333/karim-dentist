import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getConversation,
  setConversationStatus,
} from "@/services/whatsapp";

export const runtime = "nodejs";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  status: z.enum(["active", "archived"]),
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

    const updated = await setConversationStatus(
      service,
      parsed.data.conversationId,
      parsed.data.status,
    );
    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("[whatsapp/conversations/status]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import {
  getConversation,
  setConversationStarred,
} from "@/services/whatsapp";

export const runtime = "nodejs";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  starred: z.boolean(),
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

    const updated = await setConversationStarred(
      service,
      parsed.data.conversationId,
      parsed.data.starred,
    );
    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("[whatsapp/conversations/star]", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

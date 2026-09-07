import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

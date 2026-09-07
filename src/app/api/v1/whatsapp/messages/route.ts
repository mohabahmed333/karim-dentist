import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { listMessagesPage } from "@/services/whatsapp";

export const runtime = "nodejs";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

function parseBefore(raw?: string) {
  if (!raw) return null;
  const [waTimestamp, id] = raw.split("|");
  if (!waTimestamp || !id) return null;
  return { waTimestamp, id };
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      conversationId: url.searchParams.get("conversationId"),
      before: url.searchParams.get("before") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const { messages, nextCursor } = await listMessagesPage(
      supabase,
      parsed.data.conversationId,
      {
        before: parseBefore(parsed.data.before),
        limit: parsed.data.limit,
      },
    );

    return NextResponse.json({
      messages,
      nextCursor: nextCursor
        ? `${nextCursor.waTimestamp}|${nextCursor.id}`
        : null,
    });
  } catch (error) {
    console.error("[whatsapp/messages]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

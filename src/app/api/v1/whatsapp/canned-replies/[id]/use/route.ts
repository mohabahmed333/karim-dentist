import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { recordCannedReplyUse } from "@/services/whatsapp/cannedReplies";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Count one use, so the composer's / menu lists the replies staff reach for most. */
export async function POST(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await recordCannedReplyUse(auth.supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/canned-replies use]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

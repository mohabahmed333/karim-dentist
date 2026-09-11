import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import {
  createCannedReply,
  deleteCannedReply,
  isDuplicateSlashKey,
  listCannedReplies,
} from "@/services/whatsapp/cannedReplies";
import { createCannedReplySchema } from "@/services/whatsapp/cannedReplyInput";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const all = new URL(request.url).searchParams.get("all") === "1";
    const replies = await listCannedReplies(supabase, {
      activeOnly: !all,
    });
    return NextResponse.json({ replies });
  } catch (error) {
    console.error("[whatsapp/canned-replies GET]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = createCannedReplySchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid body", path: issue?.path },
      { status: 400 },
    );
  }
  try {
    const reply = await createCannedReply(auth.supabase, parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    if (isDuplicateSlashKey(error)) {
      return NextResponse.json(
        { error: "Slash key already used", code: "SLASH_KEY_TAKEN" },
        { status: 409 },
      );
    }
    console.error("[whatsapp/canned-replies POST]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    await deleteCannedReply(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/canned-replies DELETE]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

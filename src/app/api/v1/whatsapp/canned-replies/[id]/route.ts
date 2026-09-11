import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { isDuplicateSlashKey, updateCannedReply } from "@/services/whatsapp/cannedReplies";
import { updateCannedReplySchema } from "@/services/whatsapp/cannedReplyInput";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Edit a quick reply: any subset of its fields, including switching it off. */
export async function PATCH(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = updateCannedReplySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Invalid body", path: issue?.path },
      { status: 400 },
    );
  }

  try {
    const reply = await updateCannedReply(auth.supabase, id, parsed.data);
    return NextResponse.json({ reply });
  } catch (error) {
    if (isDuplicateSlashKey(error)) {
      return NextResponse.json(
        { error: "Slash key already used", code: "SLASH_KEY_TAKEN" },
        { status: 409 },
      );
    }
    // PostgREST's "no rows" from .single() after an update that matched nothing.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[whatsapp/canned-replies PATCH]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

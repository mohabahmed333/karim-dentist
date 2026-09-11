import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { loadQuickReplyContext } from "@/services/whatsapp/quickReplyContext";

export const runtime = "nodejs";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  lang: z.enum(["ar", "en"]).default("en"),
});

/** Values for the fill-in fields of quick replies used in one conversation. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const params = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse({
    conversationId: params.get("conversationId"),
    lang: params.get("lang") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  try {
    const values = await loadQuickReplyContext(
      auth.supabase,
      parsed.data.conversationId,
      parsed.data.lang,
    );
    if (!values) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ values });
  } catch (error) {
    console.error("[whatsapp/canned-replies context]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

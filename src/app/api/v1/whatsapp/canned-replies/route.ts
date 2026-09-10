import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import {
  createCannedReply,
  deleteCannedReply,
  listCannedReplies,
} from "@/services/whatsapp/cannedReplies";

export const runtime = "nodejs";

const postSchema = z.object({
  slash_key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i),
  title: z.string().trim().min(1).max(80),
  title_ar: z.string().trim().max(80).optional().nullable(),
  body: z.string().trim().min(1).max(2000),
  body_ar: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.number().int().optional(),
});

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
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const reply = await createCannedReply(supabase, {
      slash_key: parsed.data.slash_key.toLowerCase(),
      title: parsed.data.title,
      title_ar: parsed.data.title_ar,
      body: parsed.data.body,
      body_ar: parsed.data.body_ar,
      sort_order: parsed.data.sort_order,
    });
    return NextResponse.json({ reply });
  } catch (error) {
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

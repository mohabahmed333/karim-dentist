import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { z } from "zod";
import { firstNameFromEmail } from "@/features/admin/lib/dashboardModel";

export const runtime = "nodejs";

const postSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
  pinned: z.boolean().optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000).optional(),
  pinned: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

function authorFromUser(email: string | null | undefined): string {
  return email ? firstNameFromEmail(email) : "Admin";
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;
    const user = auth.user;

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("whatsapp_notes")
      .insert({
        conversation_id: parsed.data.conversationId,
        body: parsed.data.body,
        pinned: parsed.data.pinned ?? false,
        author: authorFromUser(user.email),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (error) {
    console.error("[whatsapp/notes POST]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const patch: { body?: string; pinned?: boolean; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.body !== undefined) patch.body = parsed.data.body;
    if (parsed.data.pinned !== undefined) patch.pinned = parsed.data.pinned;

    const { data, error } = await supabase
      .from("whatsapp_notes")
      .update(patch)
      .eq("id", parsed.data.id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ note: data });
  } catch (error) {
    console.error("[whatsapp/notes PATCH]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const supabase = auth.supabase;

    const url = new URL(request.url);
    const parsed = deleteSchema.safeParse({
      id: url.searchParams.get("id"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("whatsapp_notes")
      .delete()
      .eq("id", parsed.data.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[whatsapp/notes DELETE]", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

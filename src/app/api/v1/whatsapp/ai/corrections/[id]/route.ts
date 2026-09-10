import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { markReviewed, promoteToKnowledge } from "@/services/whatsapp_ai/corrections";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ action: z.enum(["reviewed", "promote"]) });

export async function PATCH(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = createServiceClient();
  try {
    if (parsed.data.action === "promote") {
      return NextResponse.json({ ok: true, ...(await promoteToKnowledge(db, id)) });
    }
    await markReviewed(db, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json(
      { error: message },
      { status: /not found/i.test(message) ? 404 : 500 },
    );
  }
}

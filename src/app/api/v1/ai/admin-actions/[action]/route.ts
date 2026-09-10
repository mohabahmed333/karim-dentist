import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createWhatsappSender } from "@/services/admin_ai/whatsappSender";
import { cancelProposal, confirmProposal } from "@/services/admin_ai";

const bodySchema = z.object({
  proposalId: z.string().uuid(),
});

type Params = { params: Promise<{ action: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const ctx = {
    db: auth.supabase,
    actorId: auth.user.id,
    sendWhatsapp: createWhatsappSender(),
  };

  try {
    if (action === "confirm") {
      const result = await confirmProposal(ctx, parsed.data.proposalId);
      return NextResponse.json(result);
    }
    if (action === "cancel") {
      await cancelProposal(ctx, parsed.data.proposalId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 400 },
    );
  }
}

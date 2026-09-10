import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createWhatsappSender } from "@/services/admin_ai/whatsappSender";
import { createProposal, createProposalInputSchema } from "@/services/admin_ai";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createProposalInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid proposal", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createProposal(
      {
        db: auth.supabase,
        actorId: auth.user.id,
        patientKey: parsed.data.patientKey,
        sendWhatsapp: createWhatsappSender(),
      },
      parsed.data,
    );
    return NextResponse.json({
      proposalId: result.proposal.id,
      summary: result.proposal.summary,
      expiresAt: result.proposal.expires_at,
      diffs: result.diffs,
      actions: parsed.data.actions,
      snapshotHash: result.snapshotHash,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Proposal failed" },
      { status: 400 },
    );
  }
}

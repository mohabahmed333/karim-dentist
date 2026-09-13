import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyDepositConfirmed } from "@/services/deposits/notifyDecision";
import { confirmDepositPaid, rejectDeposit } from "@/services/deposits/store";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["confirm", "reject"]),
  reason: z.string().trim().max(500).default(""),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  // Confirming a deposit confirms an appointment, and rejecting one releases the
  // slot — so each gates on the permission for the thing it actually does.
  const auth = await requirePermission(
    parsed.data.action === "confirm" ? "reservations.confirm" : "reservations.cancel",
  );
  if (auth.error) return auth.error;

  const { id } = await params;
  const service = createServiceClient();
  const decidedBy = auth.session?.user?.id ?? null;
  const reason = parsed.data.reason || `${parsed.data.action}ed by staff`;

  const result =
    parsed.data.action === "confirm"
      ? await confirmDepositPaid(service, id, decidedBy, reason)
      : await rejectDeposit(service, id, decidedBy, reason);

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Could not apply" }, { status: 400 });
  }

  // The patient sent money and is waiting to hear. Confirming used to be
  // silent — the row moved to paid and nothing reached them — while the
  // automatic path had always replied. Reported rather than thrown: the
  // decision is already committed, so a messaging failure must not read as a
  // failed confirmation, but staff do need to know the patient was not told.
  //
  // Only a decision that actually moved the row sends anything. The RPC is
  // idempotent, so a double-click succeeds twice; without this the patient is
  // thanked twice for one payment.
  const notified =
    parsed.data.action === "confirm" && result.changed
      ? await notifyDepositConfirmed(service, id)
      : ({
          sent: false,
          reason: result.changed ? "not_applicable" : "already_decided",
        } as const);

  return NextResponse.json({ ok: true, notified });
}

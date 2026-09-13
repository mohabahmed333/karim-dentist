import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
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
  return NextResponse.json({ ok: true });
}

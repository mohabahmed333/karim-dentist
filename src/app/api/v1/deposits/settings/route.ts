import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { loadDepositSettings } from "@/services/deposits/store";

export const runtime = "nodejs";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  amount_egp: z.number().min(0).max(100_000).optional(),
  instapay_handle: z.string().trim().max(200).optional(),
  wallet_number: z.string().trim().max(50).optional(),
  // How the clinic's own name prints on a receipt. Without at least one entry
  // the recipient check can never pass, so the readiness list flags it.
  recipient_names: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  hold_minutes: z.number().int().min(5).max(240).optional(),
  auto_confirm: z.boolean().optional(),
  ocr_cross_check: z.boolean().optional(),
  min_confidence: z.number().min(0).max(1).optional(),
  amount_tolerance_egp: z.number().min(0).max(10_000).optional(),
  receipt_max_age_hours: z.number().int().min(1).max(720).optional(),
});

export async function GET() {
  const auth = await requirePermission("settings.view");
  if (auth.error) return auth.error;
  return NextResponse.json(
    { settings: await loadDepositSettings(createServiceClient()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("settings.edit");
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const current = await loadDepositSettings(service);
  if (!current) {
    return NextResponse.json({ error: "Deposit settings row is missing" }, { status: 409 });
  }

  const next = { ...current, ...parsed.data };
  // Turning this on with nowhere to send the money would have the assistant ask
  // patients to transfer to nothing at all.
  if (next.enabled) {
    if (Number(next.amount_egp) <= 0) {
      return NextResponse.json({ error: "Set a deposit amount above zero first" }, { status: 400 });
    }
    if (!next.instapay_handle.trim() && !next.wallet_number.trim()) {
      return NextResponse.json(
        { error: "Add an InstaPay handle or a wallet number first" },
        { status: 400 },
      );
    }
  }

  const { error } = await service
    .from("deposit_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", current.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ settings: await loadDepositSettings(service) });
}

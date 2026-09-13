import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { listDeposits } from "@/services/deposits/queries";

export const runtime = "nodejs";

const STATUSES = new Set([
  "awaiting_receipt",
  "in_review",
  "paid",
  "expired",
  "rejected",
  "cancelled",
]);

export async function GET(request: Request) {
  const auth = await requirePermission("reservations.view");
  if (auth.error) return auth.error;

  const requested = new URL(request.url).searchParams.get("status") ?? "";
  const status = STATUSES.has(requested) ? requested : undefined;

  try {
    const deposits = await listDeposits(createServiceClient(), { status });
    return NextResponse.json({ deposits }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load deposits" },
      { status: 500 },
    );
  }
}

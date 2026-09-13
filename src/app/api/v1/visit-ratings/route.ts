import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { listVisitRatings } from "@/services/visit_ratings/queries";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requirePermission("assistant-review.view");
  if (auth.error) return auth.error;

  const onlyNeedingCall =
    new URL(request.url).searchParams.get("needsCall") !== "false";
  try {
    const ratings = await listVisitRatings(createServiceClient(), { onlyNeedingCall });
    return NextResponse.json({ ratings }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load ratings" },
      { status: 500 },
    );
  }
}

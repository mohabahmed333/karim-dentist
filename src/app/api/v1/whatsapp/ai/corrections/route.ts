import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import { exportReviewed, listCorrections } from "@/services/whatsapp_ai/corrections";

export const runtime = "nodejs";

/** The review queue, or `?export=1` for reviewed examples as JSON. */
export async function GET(request: Request) {
  const auth = await requirePermission("support.view");
  if (auth.error) return auth.error;
  const db = createServiceClient();
  const params = new URL(request.url).searchParams;
  try {
    if (params.get("export") === "1") {
      return NextResponse.json(
        { examples: await exportReviewed(db) },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({
      corrections: await listCorrections(db, {
        includeReviewed: params.get("all") === "1",
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

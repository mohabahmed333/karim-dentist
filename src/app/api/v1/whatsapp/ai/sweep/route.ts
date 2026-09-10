import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sweepStaleAutoReplyJobs } from "@/services/whatsapp_ai/sweep";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const provided =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      request.headers.get("x-cron-secret") ??
      "";
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const results = await sweepStaleAutoReplyJobs(createServiceClient(), 5);
    return NextResponse.json({ swept: results.length, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sweep failed" },
      { status: 500 },
    );
  }
}

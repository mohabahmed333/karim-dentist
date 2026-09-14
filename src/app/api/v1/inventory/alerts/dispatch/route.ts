import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runInventoryAlertDispatch } from "@/services/inventory/runInventoryAlertDispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Drain the low-stock WhatsApp alert outbox.
 *
 * GET for Vercel Cron and curl, POST for pg_net — register alongside the
 * patient-notifications dispatch job (pg_cron, outside vercel.json since
 * the Hobby plan caps vercel.json crons at daily) with a jobname like
 * 'inventory-alerts-dispatch'.
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Dispatch is disabled until CRON_SECRET is configured" },
      { status: 503 },
    );
  }
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runInventoryAlertDispatch(createServiceClient());
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 500 },
    );
  }
}

export const GET = handle;
export const POST = handle;

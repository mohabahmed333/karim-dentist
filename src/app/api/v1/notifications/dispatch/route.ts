import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runDispatch } from "@/services/patient_notifications/runDispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Drain the patient notification outbox.
 *
 * GET for Vercel Cron and curl, POST for pg_net — pg_cron drives this every
 * minute, because vercel.json is capped at daily on the Hobby plan.
 */
async function handle(request: Request) {
  // Fail closed, matching the sweep endpoint: this sends WhatsApp messages to
  // patients, so an unset secret must lock it rather than leave it open.
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
    const result = await runDispatch(createServiceClient());
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

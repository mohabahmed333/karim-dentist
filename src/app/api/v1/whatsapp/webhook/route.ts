import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getKapsoConfig } from "@/lib/kapso/client";
import { verifyKapsoWebhookSignature } from "@/lib/kapso/verifyWebhook";
import { processKapsoWebhook } from "@/services/whatsapp";
import type { KapsoWebhookBody } from "@/services/whatsapp/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");
  const event = request.headers.get("x-webhook-event") ?? "unknown";
  const idempotencyKey =
    request.headers.get("x-idempotency-key") ??
    `fallback:${event}:${Buffer.from(rawBody).toString("base64url").slice(0, 64)}`;

  try {
    const { webhookSecret } = getKapsoConfig();
    if (
      !verifyKapsoWebhookSignature(rawBody, signature, webhookSecret)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as KapsoWebhookBody;
    const supabase = createServiceClient();
    const result = await processKapsoWebhook(
      supabase,
      event,
      idempotencyKey,
      body,
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[whatsapp/webhook]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

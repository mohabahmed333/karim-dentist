import { after, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getKapsoConfig } from "@/lib/kapso/client";
import { verifyKapsoWebhookSignature } from "@/lib/kapso/verifyWebhook";
import { processKapsoWebhook } from "@/services/whatsapp";
import type { KapsoWebhookBody } from "@/services/whatsapp/types";
import { enqueueAutoReplyJob } from "@/services/whatsapp_ai/store";
import { processAutoReplyJob } from "@/services/whatsapp_ai/processJob";

export const runtime = "nodejs";
/** after() is bounded by this; the Groq call is capped well below it. */
export const maxDuration = 60;

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

    // Enqueue synchronously: after() extends this invocation, it does not
    // persist work, so a job written here survives a crash and the sweeper can
    // pick it up. The unique index on inbound_message_id makes a webhook retry
    // a no-op rather than a second reply to the same patient message.
    const jobIds: string[] = [];
    for (const ref of result.inbound) {
      try {
        const id = await enqueueAutoReplyJob(supabase, {
          conversationId: ref.conversationId,
          inboundMessageId: ref.messageId,
        });
        if (id) jobIds.push(id);
      } catch (err) {
        // Never fail ingestion because the responder could not be queued: Kapso
        // would retry the whole webhook and redeliver an already-stored message.
        console.error("[whatsapp/webhook] enqueue failed", err);
      }
    }

    // Generate after the response, so Kapso is not held open on a model call it
    // would time out and retry.
    if (jobIds.length > 0) {
      after(async () => {
        for (const jobId of jobIds) {
          try {
            await processAutoReplyJob(supabase, jobId);
          } catch (err) {
            console.error("[whatsapp/webhook] auto-reply failed", err);
          }
        }
      });
    }

    return NextResponse.json({ ok: true, result: result.status });
  } catch (error) {
    console.error("[whatsapp/webhook]", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

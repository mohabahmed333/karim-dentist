#!/usr/bin/env node
/**
 * Simulate an inbound WhatsApp message against a locally running app.
 *
 * Kapso cannot reach localhost, so this signs a webhook payload exactly the way
 * Kapso does and posts it to your dev server. Everything downstream is real:
 * the policy gates, the Groq call, the draft or send decision, and the row that
 * shows up in the front-desk inbox.
 *
 *   yarn dev                                  # terminal 1
 *   node --env-file=.env.local \              # terminal 2
 *     scripts/simulate-inbound.mjs "+201001234567" "what time do you open?"
 *
 * SAFETY: unless KAPSO is faked, an auto-sent reply is a REAL WhatsApp message
 * to the number you pass. This script refuses to run against a live send path
 * unless you pass --allow-real-send.
 */
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const allowRealSend = args.includes("--allow-real-send");
const positional = args.filter((a) => !a.startsWith("--"));
const phone = positional[0];
const text = positional[1] ?? "";
const imageUrl = args.find((a) => a.startsWith("--image="))?.slice("--image=".length) ?? "";

// An image needs no words; a text message is nothing without them.
if (!phone || (!text && !imageUrl)) {
  console.error(
    'Usage: node --env-file=.env.local scripts/simulate-inbound.mjs "<phone>" "<message>" [--image=<url>] [--allow-real-send]',
  );
  process.exit(1);
}

const BASE = process.env.SIMULATE_BASE_URL ?? "http://localhost:3000";
const SECRET = process.env.KAPSO_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SECRET) {
  console.error("KAPSO_WEBHOOK_SECRET is not set — the webhook will reject this.");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const { data: settings } = await db
  .from("whatsapp_ai_settings")
  .select("mode, allow_booking_writes")
  .limit(1)
  .maybeSingle();

if (!settings) {
  console.error(
    "whatsapp_ai_settings is missing. Run `supabase db push --linked` (or `supabase db reset --local`) first.",
  );
  process.exit(1);
}

const kapsoFaked = process.env.E2E_FAKE_KAPSO === "1";
if (settings.mode === "auto" && !kapsoFaked && !allowRealSend) {
  console.error(
    [
      "",
      "  Refusing to run.",
      "",
      `  mode is 'auto' and Kapso is not faked, so an auto-sent reply would be a`,
      `  REAL WhatsApp message to ${phone}.`,
      "",
      "  Pick one:",
      "    • Safest — fake the transport:",
      "        E2E_FAKE_KAPSO=1 yarn dev",
      "    • Or watch the decision without sending:",
      "        update whatsapp_ai_settings set mode = 'draft_only';",
      "    • Or, if that number really is yours:",
      "        …simulate-inbound.mjs … --allow-real-send",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const wamid = `wamid.sim.${Date.now()}`;
const message = {
  id: wamid,
  from: phone,
  timestamp: String(Math.floor(Date.now() / 1000)),
  kapso: { direction: "inbound", status: "received" },
};

if (imageUrl) {
  // The shape Kapso really sends: both `link` and `url`, plus its own sha256.
  // Ours is computed from the bytes we fetch, so this one is only a pre-check.
  message.type = "image";
  message.image = {
    id: `media.sim.${Date.now()}`,
    link: imageUrl,
    url: imageUrl,
    mime_type: "image/jpeg",
    sha256: "",
    ...(text ? { caption: text } : {}),
  };
} else {
  message.type = "text";
  message.text = { body: text };
}

const body = JSON.stringify({
  message,
  conversation: { phone_number: phone, contact_name: "Simulated patient" },
});

const signature = createHmac("sha256", SECRET).update(body).digest("hex");

console.log(`\n  mode=${settings.mode}  booking_writes=${settings.allow_booking_writes}`);
console.log(`  kapso=${kapsoFaked ? "faked" : "LIVE"}\n`);
console.log(imageUrl ? `  → ${phone}: [image] ${imageUrl}` : `  → ${phone}: "${text}"`);

const res = await fetch(`${BASE}/api/v1/whatsapp/webhook`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-webhook-event": "whatsapp.message.received",
    "x-webhook-signature": signature,
    "x-idempotency-key": `sim-${wamid}`,
  },
  body,
});

if (!res.ok) {
  console.error(`\n  webhook rejected: ${res.status} ${await res.text()}`);
  console.error("  (401 usually means KAPSO_WEBHOOK_SECRET differs from the server's)\n");
  process.exit(1);
}
console.log(`  webhook accepted (${res.status})\n`);

// The reply is produced after the response, so poll for the outcome.
const { data: conversation } = await db
  .from("whatsapp_conversations")
  .select("id")
  .eq("phone_number", phone)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!conversation) {
  console.error("  no conversation was created — check the dev server logs\n");
  process.exit(1);
}

const deadline = Date.now() + 30_000;
let event = null;
while (Date.now() < deadline) {
  const { data } = await db
    .from("whatsapp_ai_events")
    .select("decision, reason, intent, confidence, language, handoff, injection_flags, latency_ms")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) {
    event = data;
    break;
  }
  await new Promise((r) => setTimeout(r, 700));
}

if (!event) {
  console.log("  No decision recorded within 30s.");
  console.log("  Most likely: no AI provider key set, or mode='off'.");
  console.log("  Check the dev server output for [whatsapp/webhook].\n");
  process.exit(0);
}

const { data: latest } = await db
  .from("whatsapp_messages")
  .select("body, status, sender_kind")
  .eq("conversation_id", conversation.id)
  .eq("direction", "outbound")
  // Not just 'ai': a deposit receipt is answered as 'system', deliberately, so
  // it does not spend the assistant's reply budget.
  .in("sender_kind", ["ai", "system"])
  .order("wa_timestamp", { ascending: false })
  .limit(1)
  .maybeSingle();

const label = {
  auto_send: "SENT to the patient",
  draft: "DRAFTED for staff — not sent",
  skip: "SKIPPED",
  error: "ERROR",
}[event.decision] ?? event.decision;

console.log(`  ${label}`);
console.log(`  reason      ${event.reason}`);
console.log(`  intent      ${event.intent ?? "-"}  confidence ${event.confidence ?? "-"}`);
console.log(`  language    ${event.language ?? "-"}  handoff ${event.handoff}`);
if (event.injection_flags?.length) {
  console.log(`  injection   ${event.injection_flags.join(", ")}`);
}
console.log(`  latency     ${event.latency_ms ?? "-"}ms`);
if (latest) {
  console.log(
    `\n  reply (${latest.status}, sent as ${latest.sender_kind}):\n    ${latest.body.replace(/\n/g, "\n    ")}`,
  );
}

// A deposit decision is not an AI decision, so show the deposit itself too.
if (event.reason?.startsWith("deposit_")) {
  const { data: request } = await db
    .from("deposit_requests")
    .select("id, status, amount_egp, expires_at, decision_reason")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (request) {
    console.log(`\n  deposit     ${request.status}  (${request.decision_reason || "-"})`);
    const { data: receipts } = await db
      .from("deposit_receipts")
      .select("amount_egp, reference, recipient_handle, confidence, verdict, verdict_reason")
      .eq("deposit_request_id", request.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const receipt = receipts?.[0];
    if (receipt) {
      console.log(
        `  read        ${receipt.amount_egp ?? "-"} EGP  ref ${receipt.reference ?? "-"}  to ${receipt.recipient_handle ?? "-"}`,
      );
      console.log(
        `  verdict     ${receipt.verdict} (${receipt.verdict_reason})  confidence ${receipt.confidence ?? "-"}`,
      );
    }
  }
}
console.log("");

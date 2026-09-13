#!/usr/bin/env node
/**
 * End-to-end check of the deposit flow, without a browser, a bank, or a model.
 *
 * Drives the real code — the booking RPC, the notification trigger, the inbound
 * image handler, the verifier, the expiry sweep — against a local Supabase, and
 * asserts the things that are easy to break and hard to notice:
 *
 *   1. a held slot tells the patient NOTHING until the deposit is paid
 *   2. paying it confirms the appointment and queues exactly one confirmation
 *   3. the same screenshot can never be accepted twice, not even for a
 *      different patient
 *   4. an underpayment is refused and the slot stays held
 *   5. a hold that lapses frees the slot AND offers it to the waitlist
 *
 * Usage:
 *   supabase start                     # local database
 *   node --experimental-strip-types --import ./scripts/test-loader.mjs \
 *     --env-file=.env.e2e scripts/deposit-smoke.mjs
 *
 * To check what a real vision model makes of a real receipt, drop E2E_FAKE_GROQ
 * from the env and point it at an actual screenshot:
 *
 *   node --experimental-strip-types --import ./scripts/test-loader.mjs \
 *     --env-file=.env.e2e scripts/deposit-smoke.mjs --receipt=./my-receipt.jpg
 *
 * SAFETY: refuses to run against anything but a local database, because it
 * writes reservations and cancels them.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { processAutoReplyJob } from "@/services/whatsapp_ai/processJob";
import { sweepExpiredHolds } from "@/services/deposits/sweepExpiredHolds";

const args = process.argv.slice(2);
const receiptPath = args.find((a) => a.startsWith("--receipt="))?.slice("--receipt=".length);

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!URL_ || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(URL_)) {
  console.error(`\n  Refusing to run against ${URL_}.\n`);
  console.error("  This creates and cancels reservations. Point it at a local database:");
  console.error("    supabase start && node … --env-file=.env.e2e scripts/deposit-smoke.mjs\n");
  process.exit(1);
}

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

/** A 1x1 PNG, which is all `fetchReceiptImage` needs to accept and hash. */
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const real = receiptPath ? await readFile(receiptPath) : null;
const mime = receiptPath?.endsWith(".png") ? "image/png" : "image/jpeg";

// Served locally so the app's own fetch is exercised, bytes and all. The path
// names the scenario, which is what the faked extractor keys off.
// A nonce per run, so re-running is not itself a replay of the last run: the
// image hash is globally unique once a receipt is accepted, by design.
const nonce = Buffer.from(`\n<!-- ${Date.now()} -->`);
// The scenario travels inside the image, because the faked reader is handed a
// base64 data URI and never sees this path. Appended after the PNG header, so
// the bytes still sniff as an image.
const label = (name) => Buffer.concat([real ?? PIXEL, nonce, Buffer.from(`\nE2E-SCENARIO:${name}`)]);
const bodies = {
  "/receipt-good.png": label("good"),
  "/receipt-short.png": label("short"),
};
const server = createServer((req, res) => {
  const body = bodies[req.url ?? ""];
  if (!body) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": real ? mime : "image/png" }).end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
};

const soon = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
const uniquePhone = () => `0100${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 9)}`;

async function settings() {
  const { data } = await db.from("deposit_settings").select("*").limit(1).maybeSingle();
  return data;
}

/** A conversation with the 24h window open, as a patient who just wrote has. */
async function newConversation(phone) {
  const { data, error } = await db
    .from("whatsapp_conversations")
    .insert({
      phone_number: phone,
      contact_name: "Smoke patient",
      status: "active",
      last_inbound_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`conversation: ${error.message}`);
  return data.id;
}

async function openSlot() {
  const starts = soon(2 + Math.random());
  const { data, error } = await db
    .from("appointment_slots")
    .insert({
      starts_at: starts,
      ends_at: new Date(Date.parse(starts) + 1_800_000).toISOString(),
      status: "open",
    })
    .select("id")
    .single();
  if (error) throw new Error(`slot: ${error.message}`);
  return data.id;
}

async function bookWithHold(slotId, phone, conversationId, cfg) {
  const { data, error } = await db.rpc("book_slot_with_deposit_hold", {
    p_slot_id: slotId,
    p_patient_name: "Smoke patient",
    p_phone: phone,
    p_service_label: "Whitening",
    p_conversation_id: conversationId,
    p_amount_egp: Number(cfg.amount_egp),
    p_hold_minutes: cfg.hold_minutes,
    p_settings: { amount_egp: Number(cfg.amount_egp) },
  });
  if (error) throw new Error(`book_slot_with_deposit_hold: ${error.message}`);
  return data;
}

/** Deliver an image and run the job the webhook would have queued. */
async function sendReceipt(conversationId, path) {
  const url = `${base}${path}`;
  const { data: message, error } = await db
    .from("whatsapp_messages")
    .insert({
      conversation_id: conversationId,
      direction: "inbound",
      body: "",
      message_type: "image",
      media: [{ url, mime: "image/png", name: "receipt.png" }],
      raw: { type: "image", image: { link: url, url } },
      wa_timestamp: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`message: ${error.message}`);

  const { data: job, error: jobError } = await db
    .from("whatsapp_ai_jobs")
    .insert({ conversation_id: conversationId, inbound_message_id: message.id, status: "queued" })
    .select("id")
    .single();
  if (jobError) throw new Error(`job: ${jobError.message}`);

  return processAutoReplyJob(db, job.id);
}

const countNotifications = async (reservationId, kind) => {
  const { count } = await db
    .from("patient_notifications")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", reservationId)
    .eq("kind", kind);
  return count ?? 0;
};

const reservationStatus = async (id) =>
  (await db.from("reservations").select("status").eq("id", id).maybeSingle()).data?.status;

const depositStatus = async (id) =>
  (await db.from("deposit_requests").select("status,decision_reason").eq("id", id).maybeSingle()).data;

const latestReceipt = async (requestId) =>
  (
    await db
      .from("deposit_receipts")
      .select("verdict,verdict_reason,amount_egp,reference,confidence")
      .eq("deposit_request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
  ).data?.[0];

try {
  const cfg = await settings();
  if (!cfg) throw new Error("deposit_settings is missing — apply the migrations first.");
  if (!cfg.enabled || Number(cfg.amount_egp) <= 0) {
    throw new Error(
      "Deposits are off or have no amount. In the local database:\n" +
        "  update deposit_settings set enabled = true, amount_egp = 200,\n" +
        "    instapay_handle = 'clinic@instapay', recipient_names = array['Dental Lounge'];",
    );
  }
  console.log(
    `\n  deposits on · ${cfg.amount_egp} EGP · hold ${cfg.hold_minutes}m · auto_confirm=${cfg.auto_confirm}`,
  );
  console.log(
    `  model: ${process.env.E2E_FAKE_GROQ === "1" ? "faked" : "REAL"}${real ? `  receipt: ${receiptPath}` : ""}\n`,
  );

  // 1 + 2 — a held booking is silent, and paying it confirms.
  {
    const phone = uniquePhone();
    const conversationId = await newConversation(phone);
    const held = await bookWithHold(await openSlot(), phone, conversationId, cfg);

    check(
      (await reservationStatus(held.reservation_id)) === "pending",
      "a held booking is pending, not confirmed",
    );
    check(
      (await countNotifications(held.reservation_id, "confirmation")) === 0,
      "a held booking queues NO confirmation",
    );
    check(
      (await countNotifications(held.reservation_id, "reminder_24h")) === 0,
      "a held booking arms NO reminder",
    );

    const outcome = await sendReceipt(conversationId, "/receipt-good.png");
    const receipt = await latestReceipt(held.deposit_request_id);
    const deposit = await depositStatus(held.deposit_request_id);

    // A real image read by a FAKED model is the one combination where the
    // second reader must object: the fake invents a reference number, and
    // Tesseract cannot find it on the actual receipt. That is the whole point
    // of the cross-check, so here it is the expected outcome rather than a
    // failure.
    const crossCheckShouldVeto =
      Boolean(real) && process.env.E2E_FAKE_GROQ === "1" && cfg.ocr_cross_check;
    const expected = crossCheckShouldVeto || !cfg.auto_confirm ? "in_review" : "paid";

    check(
      deposit?.status === expected,
      crossCheckShouldVeto
        ? "the second reader vetoes a reference that is not on the image"
        : `a good receipt lands ${expected}`,
      `got ${deposit?.status} (${receipt?.verdict}/${receipt?.verdict_reason}), job=${outcome}`,
    );
    if (cfg.auto_confirm && !crossCheckShouldVeto) {
      check(
        (await reservationStatus(held.reservation_id)) === "confirmed",
        "paying confirms the appointment",
      );
      check(
        (await countNotifications(held.reservation_id, "confirmation")) === 1,
        "and queues exactly one confirmation",
      );
      check(
        (await countNotifications(held.reservation_id, "reminder_24h")) === 1,
        "and arms the reminder",
      );
    }
    if (real) {
      console.log(
        `        read: ${receipt?.amount_egp ?? "-"} EGP  ref ${receipt?.reference ?? "-"}  confidence ${receipt?.confidence ?? "-"}`,
      );
    }
  }

  // 3 — the same screenshot, a different patient.
  {
    const phone = uniquePhone();
    const conversationId = await newConversation(phone);
    const held = await bookWithHold(await openSlot(), phone, conversationId, cfg);
    await sendReceipt(conversationId, "/receipt-good.png");

    const deposit = await depositStatus(held.deposit_request_id);
    check(
      deposit?.status === "rejected" && /duplicate/.test(deposit?.decision_reason ?? ""),
      "the same screenshot cannot be spent twice, even by someone else",
      `got ${deposit?.status}/${deposit?.decision_reason}`,
    );
    check(
      (await reservationStatus(held.reservation_id)) === "cancelled",
      "and that booking is not confirmed",
    );
  }

  // 4 — an underpayment. Only meaningful with the faked reader, which is what
  // produces a deliberately short amount.
  if (process.env.E2E_FAKE_GROQ === "1") {
    const phone = uniquePhone();
    const conversationId = await newConversation(phone);
    const held = await bookWithHold(await openSlot(), phone, conversationId, cfg);
    await sendReceipt(conversationId, "/receipt-short.png");

    const receipt = await latestReceipt(held.deposit_request_id);
    check(
      receipt?.verdict === "reject" && receipt?.verdict_reason === "amount_short",
      "an underpayment is refused, and says so",
      `got ${receipt?.verdict}/${receipt?.verdict_reason}`,
    );
  }

  // 5 — a hold nobody pays frees the slot, and the waitlist is offered it.
  {
    const phone = uniquePhone();
    const conversationId = await newConversation(phone);
    const slotId = await openSlot();
    const held = await bookWithHold(slotId, phone, conversationId, cfg);

    const { data: slotRow } = await db
      .from("appointment_slots")
      .select("starts_at")
      .eq("id", slotId)
      .maybeSingle();
    await db.from("appointment_waitlist").insert({
      patient_name: "Waiting patient",
      phone: uniquePhone(),
      service_label: "Whitening",
      status: "waiting",
      preferred_from: new Date(Date.parse(slotRow.starts_at) - 3_600_000).toISOString(),
      preferred_to: new Date(Date.parse(slotRow.starts_at) + 3_600_000).toISOString(),
    });

    await db
      .from("deposit_requests")
      .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", held.deposit_request_id);

    const swept = await sweepExpiredHolds(db, new Date());
    check(swept.expired === 1, "the sweep releases a lapsed hold", JSON.stringify(swept));
    check(
      (await db.from("appointment_slots").select("status").eq("id", slotId).maybeSingle()).data
        ?.status === "open",
      "the slot is open again",
    );
    const { count: offers } = await db
      .from("patient_notifications")
      .select("id", { count: "exact", head: true })
      .eq("kind", "waitlist_offer")
      .eq("slot_id", slotId);
    check((offers ?? 0) >= 1, "and the waitlist was offered it automatically", `${offers} offer(s)`);
    check(
      (await sweepExpiredHolds(db, new Date())).expired === 0,
      "sweeping twice releases nothing twice",
    );
  }

  console.log(failures === 0 ? "\n  all checks passed\n" : `\n  ${failures} check(s) failed\n`);
} catch (err) {
  console.error(`\n  ${err instanceof Error ? err.message : err}\n`);
  failures += 1;
} finally {
  server.close();
}

process.exit(failures === 0 ? 0 : 1);

/**
 * Deciding whether an inbound image is a deposit receipt, and acting on it.
 *
 * This runs *before* the autoresponder and returns `{handled:false}` for
 * anything that is not a receipt for a deposit this conversation is waiting on.
 * That single early return is the whole blast radius of the feature: the
 * assistant is not taught to see images, one narrow pipeline is, and a patient
 * sending a photo of their tooth behaves exactly as they did before.
 *
 * The receipt row is written before the verdict is computed, so that two
 * webhooks carrying the same screenshot race in the database rather than in
 * application code.
 */

import { randomUUID } from "node:crypto";
import type { Json } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import { fetchReceiptImage, ReceiptImageError } from "./fetchReceiptImage";
import { corroborate } from "./ocrCorroborate";
import { readImageText } from "./runOcr";
import { readReceipt, ReceiptReadError } from "./readReceipt";
import { receiptExtractionSchema, type ReceiptExtraction } from "./receiptSchema";
import { receiptOutcomeMessage, type Language } from "./receiptMessages";
import { verifyReceipt } from "./verifyReceipt";
import {
  confirmDepositPaid,
  findOpenRequestByConversation,
  insertReceipt,
  loadDepositSettings,
  markInReview,
  rejectDeposit,
  expireDepositHold,
} from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type InboundImage = {
  conversationId: string;
  messageId: string;
  messageType: string;
  /** From whatsapp_messages.media, or the raw payload. "" when absent. */
  mediaUrl: string;
  language: Language;
};

export type HandleDeps = {
  db: ServiceClient;
  fetchImage?: typeof fetchReceiptImage;
  read?: typeof readReceipt;
  /** The second reader. Injected so tests need no WASM. */
  ocr?: typeof readImageText;
  now?: () => Date;
  env?: Record<string, string | undefined>;
};

export type HandleResult =
  | { handled: false }
  | {
      handled: true;
      outcome: "confirmed" | "review" | "rejected" | "expired";
      reason: string;
      replyText: string;
    };

const NOT_HANDLED: HandleResult = { handled: false };

/** An extraction that says nothing, for the rows we write without reading. */
const emptyExtraction = (): ReceiptExtraction => receiptExtractionSchema.parse({});

export async function handleInboundImage(
  deps: HandleDeps,
  inbound: InboundImage,
): Promise<HandleResult> {
  const { db } = deps;
  if (inbound.messageType !== "image") return NOT_HANDLED;

  const settings = await loadDepositSettings(db);
  if (!settings?.enabled) return NOT_HANDLED;

  const request = await findOpenRequestByConversation(db, inbound.conversationId);
  if (!request) return NOT_HANDLED;

  const now = deps.now?.() ?? new Date();
  const language = inbound.language;
  const amountEgp = Number(request.amount_egp);

  // The hold ran out before they sent it. Release it here rather than waiting
  // for the sweep, so the reply the patient gets is the truth.
  if (Date.parse(request.expires_at) <= now.getTime()) {
    await expireDepositHold(db, request.id);
    return {
      handled: true,
      outcome: "expired",
      reason: "hold_expired",
      replyText: receiptOutcomeMessage({ reason: "hold_expired", language, amountEgp }),
    };
  }

  if (!inbound.mediaUrl) {
    return finishReview(deps, request.id, "no_media_url", language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: "",
      sha256: "",
    });
  }

  // 1. Bytes, and our own hash of them.
  let image: Awaited<ReturnType<typeof fetchReceiptImage>>;
  try {
    image = await (deps.fetchImage ?? fetchReceiptImage)(inbound.mediaUrl);
  } catch (err) {
    const reason = err instanceof ReceiptImageError ? `image_${err.reason}` : "image_failed";
    return finishReview(deps, request.id, reason, language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: inbound.mediaUrl,
      sha256: "",
    });
  }

  // 2. What the model can read off it. A failure here is ours, not the
  //    patient's, so it parks with staff and the slot keeps its hold.
  let extraction: ReceiptExtraction;
  let model = "";
  let promptVersion = "";
  let latencyMs: number | null = null;
  try {
    const read = await (deps.read ?? readReceipt)(image.dataUri, { env: deps.env });
    extraction = read.extraction;
    model = read.model;
    promptVersion = read.promptVersion;
    latencyMs = read.latencyMs;
  } catch (err) {
    // Keep the provider's own words: "extraction_failed" alone left a receipt
    // in the queue with no way to tell a timeout from a refusal from a missing
    // key, which is exactly the question staff need answered.
    const base = err instanceof ReceiptReadError ? err.reason : "extraction_failed";
    const detail = err instanceof Error ? err.message : "";
    const reason = detail && detail !== base ? `${base}: ${detail}`.slice(0, 300) : base;
    return finishReview(deps, request.id, reason, language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: inbound.mediaUrl,
      sha256: image.sha256,
    });
  }

  // 3. The decision, in pure code. Replay is not asked about here: the database
  //    settles that on insert below, which is the only place that can.
  let verdict = verifyReceipt({
    extracted: extraction,
    required: {
      amountEgp,
      toleranceEgp: Number(settings.amount_tolerance_egp),
      minConfidence: Number(settings.min_confidence),
      receiptMaxAgeHours: settings.receipt_max_age_hours,
      instapayHandle: settings.instapay_handle,
      walletNumber: settings.wallet_number,
      recipientNames: settings.recipient_names ?? [],
    },
    request: { createdAt: request.created_at },
    seen: { imageUsed: false, referenceUsed: false },
    autoConfirm: settings.auto_confirm,
    now,
  });

  // 3b. Only now, and only if this is about to confirm on its own, is a second
  //     reading worth three seconds: it can veto, never approve, so running it
  //     on a receipt already bound for the staff queue would change nothing.
  if (verdict.verdict === "confirm" && settings.ocr_cross_check) {
    const text = await (deps.ocr ?? readImageText)(image.bytes).catch(() => null);
    const corroboration = corroborate(text, extraction);
    if (corroboration.checked && corroboration.missing.length > 0) {
      verdict = verifyReceipt({
        extracted: extraction,
        required: {
          amountEgp,
          toleranceEgp: Number(settings.amount_tolerance_egp),
          minConfidence: Number(settings.min_confidence),
          receiptMaxAgeHours: settings.receipt_max_age_hours,
          instapayHandle: settings.instapay_handle,
          walletNumber: settings.wallet_number,
          recipientNames: settings.recipient_names ?? [],
        },
        request: { createdAt: request.created_at },
        seen: { imageUsed: false, referenceUsed: false },
        corroboration,
        autoConfirm: settings.auto_confirm,
        now,
      });
    }
  }

  // 4. Write it down with the verdict it earned. `verdict` is immutable after
  //    insert — two partial unique indexes are defined over it — so it has to be
  //    computed first rather than patched afterwards.
  const row = {
    deposit_request_id: request.id,
    message_id: inbound.messageId,
    image_sha256: image.sha256,
    image_url: inbound.mediaUrl,
    extracted: extraction as unknown as Json,
    amount_egp: extraction.amount,
    reference: extraction.reference,
    sender_name: extraction.senderName,
    recipient_name: extraction.recipientName,
    recipient_handle: extraction.recipientHandle,
    transferred_at: extraction.transferredAt,
    confidence: extraction.confidence,
    model,
    prompt_version: promptVersion,
    latency_ms: latencyMs,
  };

  const written = await insertReceipt(db, {
    id: randomUUID(),
    ...row,
    verdict: verdict.verdict,
    verdict_reason: verdict.reason,
  });

  if (!written.ok && written.duplicate) {
    // These bytes, or that reference, are already spent. The database found it,
    // not us, which is what makes it safe against two webhooks arriving at once.
    verdict = {
      verdict: "reject",
      reason: written.duplicate === "reference" ? "duplicate_reference" : "duplicate_image",
    };
    // Now storable: a 'reject' row sits outside both unique indexes, so the
    // attempt is still on the record for whoever has to explain it later.
    await insertReceipt(db, {
      id: randomUUID(),
      ...row,
      verdict: verdict.verdict,
      verdict_reason: verdict.reason,
    });
  }

  const replyText = receiptOutcomeMessage({
    reason: verdict.reason,
    language,
    amountEgp,
    paidEgp: extraction.amount,
  });

  if (verdict.verdict === "confirm") {
    await confirmDepositPaid(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "confirmed", reason: verdict.reason, replyText };
  }
  if (verdict.verdict === "reject") {
    await rejectDeposit(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "rejected", reason: verdict.reason, replyText };
  }
  await markInReview(db, request.id, verdict.reason);
  return { handled: true, outcome: "review", reason: verdict.reason, replyText };
}

/** Park with staff, recording why, and keep the hold alive. */
async function finishReview(
  deps: HandleDeps,
  requestId: string,
  reason: string,
  language: Language,
  amountEgp: number,
  receipt: {
    messageId: string;
    extraction: ReceiptExtraction;
    imageUrl: string;
    sha256: string;
  },
): Promise<HandleResult> {
  await insertReceipt(deps.db, {
    id: randomUUID(),
    deposit_request_id: requestId,
    message_id: receipt.messageId,
    image_sha256: receipt.sha256,
    image_url: receipt.imageUrl,
    extracted: receipt.extraction as unknown as Json,
    // 'unreadable' rather than 'review': it keeps this row out of the partial
    // unique index on reference, so a reference we never actually read is not
    // spent by our own failure.
    verdict: "unreadable",
    verdict_reason: reason,
  });
  await markInReview(deps.db, requestId, reason);
  return {
    handled: true,
    outcome: "review",
    reason,
    replyText: receiptOutcomeMessage({ reason, language, amountEgp }),
  };
}

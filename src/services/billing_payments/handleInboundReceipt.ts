/**
 * Deciding whether an inbound WhatsApp image is a billing-payment receipt,
 * and acting on it. Mirrors src/services/deposits/handleInboundImage.ts
 * closely — same pipeline, different tables, no expiry/hold logic (a
 * billing request has no slot to release, so it never lapses on its own).
 */

import { randomUUID } from "node:crypto";
import type { Json } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import { fetchReceiptImage, ReceiptImageError } from "@/services/deposits/fetchReceiptImage";
import { corroborate } from "@/services/deposits/ocrCorroborate";
import { readImageText } from "@/services/deposits/runOcr";
import { readReceipt, ReceiptReadError } from "@/services/deposits/readReceipt";
import { receiptExtractionSchema, type ReceiptExtraction } from "@/services/deposits/receiptSchema";
import type { Language } from "@/services/deposits/receiptMessages";
import { loadDepositSettings } from "@/services/deposits/store";
import { verifyReceipt } from "@/services/deposits/verifyReceipt";
import { billingReceiptOutcomeMessage } from "./receiptMessages";
import {
  confirmBillingPayment,
  findOpenBillingRequestByConversation,
  insertBillingReceipt,
  markBillingRequestInReview,
  rejectBillingPayment,
} from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type InboundImage = {
  conversationId: string;
  messageId: string;
  messageType: string;
  mediaUrl: string;
  language: Language;
};

export type HandleDeps = {
  db: ServiceClient;
  fetchImage?: typeof fetchReceiptImage;
  read?: typeof readReceipt;
  ocr?: typeof readImageText;
  now?: () => Date;
  env?: Record<string, string | undefined>;
};

export type HandleResult =
  | { handled: false }
  | { handled: true; outcome: "confirmed" | "review" | "rejected"; reason: string; replyText: string };

const NOT_HANDLED: HandleResult = { handled: false };
const emptyExtraction = (): ReceiptExtraction => receiptExtractionSchema.parse({});

export async function handleInboundBillingReceipt(
  deps: HandleDeps,
  inbound: InboundImage,
): Promise<HandleResult> {
  const { db } = deps;
  if (inbound.messageType !== "image") return NOT_HANDLED;

  // Reused for recipient identity + OCR thresholds only, not the `enabled`
  // toggle — that flag is specifically the deposit-collection switch.
  const settings = await loadDepositSettings(db);
  if (!settings) return NOT_HANDLED;

  const request = await findOpenBillingRequestByConversation(db, inbound.conversationId);
  if (!request) return NOT_HANDLED;

  const now = deps.now?.() ?? new Date();
  const language = inbound.language;
  const amountEgp = Number(request.amount_egp);

  if (!inbound.mediaUrl) {
    return finishReview(deps, request.id, "no_media_url", language, amountEgp, {
      messageId: inbound.messageId,
      extraction: emptyExtraction(),
      imageUrl: "",
      sha256: "",
    });
  }

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

  const requiredFields = {
    amountEgp,
    toleranceEgp: Number(settings.amount_tolerance_egp),
    minConfidence: Number(settings.min_confidence),
    receiptMaxAgeHours: settings.receipt_max_age_hours,
    instapayHandle: settings.instapay_handle,
    walletNumber: settings.wallet_number,
    recipientNames: settings.recipient_names ?? [],
  };

  let verdict = verifyReceipt({
    extracted: extraction,
    required: requiredFields,
    request: { createdAt: request.created_at },
    seen: { imageUsed: false, referenceUsed: false },
    autoConfirm: settings.auto_confirm,
    now,
  });

  if (verdict.verdict === "confirm" && settings.ocr_cross_check) {
    const text = await (deps.ocr ?? readImageText)(image.bytes).catch(() => null);
    const corroboration = corroborate(text, extraction);
    if (corroboration.checked && corroboration.missing.length > 0) {
      verdict = verifyReceipt({
        extracted: extraction,
        required: requiredFields,
        request: { createdAt: request.created_at },
        seen: { imageUsed: false, referenceUsed: false },
        corroboration,
        autoConfirm: settings.auto_confirm,
        now,
      });
    }
  }

  const row = {
    billing_payment_request_id: request.id,
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

  const written = await insertBillingReceipt(db, {
    id: randomUUID(),
    ...row,
    verdict: verdict.verdict,
    verdict_reason: verdict.reason,
  });

  if (!written.ok && written.duplicate) {
    verdict = {
      verdict: "reject",
      reason: written.duplicate === "reference" ? "duplicate_reference" : "duplicate_image",
    };
    await insertBillingReceipt(db, {
      id: randomUUID(),
      ...row,
      verdict: verdict.verdict,
      verdict_reason: verdict.reason,
    });
  }

  const replyText = billingReceiptOutcomeMessage({
    reason: verdict.reason,
    language,
    amountEgp,
    paidEgp: extraction.amount,
  });

  if (verdict.verdict === "confirm") {
    await confirmBillingPayment(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "confirmed", reason: verdict.reason, replyText };
  }
  if (verdict.verdict === "reject") {
    await rejectBillingPayment(db, request.id, null, verdict.reason);
    return { handled: true, outcome: "rejected", reason: verdict.reason, replyText };
  }
  await markBillingRequestInReview(db, request.id, verdict.reason);
  return { handled: true, outcome: "review", reason: verdict.reason, replyText };
}

async function finishReview(
  deps: HandleDeps,
  requestId: string,
  reason: string,
  language: Language,
  amountEgp: number,
  receipt: { messageId: string; extraction: ReceiptExtraction; imageUrl: string; sha256: string },
): Promise<HandleResult> {
  await insertBillingReceipt(deps.db, {
    id: randomUUID(),
    billing_payment_request_id: requestId,
    message_id: receipt.messageId,
    image_sha256: receipt.sha256,
    image_url: receipt.imageUrl,
    extracted: receipt.extraction as unknown as Json,
    verdict: "unreadable",
    verdict_reason: reason,
  });
  await markBillingRequestInReview(deps.db, requestId, reason);
  return {
    handled: true,
    outcome: "review",
    reason,
    replyText: billingReceiptOutcomeMessage({ reason, language, amountEgp }),
  };
}

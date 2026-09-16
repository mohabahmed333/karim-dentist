/**
 * Sending a billing payment request over WhatsApp, and telling the patient
 * later that it was confirmed.
 *
 * Unlike a deposit ask — always sent as a reply within an already-open
 * session — this ask is proactive (a receptionist clicked a button), so the
 * 24h window has to be checked explicitly: free text if it's open, otherwise
 * queued through the same patient_notifications outbox every other kind
 * uses, under 'billing_payment_request' (no Meta template yet — queues
 * correctly today, starts sending the moment one is approved, same as
 * 'treatment_proposal').
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import type { createServiceClient } from "@/lib/supabase/service";
import { loadDepositSettings } from "@/services/deposits/store";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { resolveOrCreateConversation } from "@/services/patient_notifications/resolveConversation";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";
import { sendWhatsappMessage, WhatsappSessionClosedError } from "@/services/whatsapp/sendMessage";
import { isWhatsappSessionOpen, latestInboundAt } from "@/services/whatsapp/sessionWindow";
import { insertBillingPaymentRequest } from "./store";
import { billingPaymentInstructions, billingReceiptOutcomeMessage } from "./receiptMessages";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { destinationLine } from "@/services/payment_methods/destinations";
import { listPaymentMethods } from "@/services/payment_methods/queries";

type ServiceClient = ReturnType<typeof createServiceClient>;

async function findConversationsBySuffix(db: ServiceClient, suffix: string) {
  const { data } = await db
    .from("whatsapp_conversations")
    .select("id,phone_number,updated_at")
    .eq("phone_suffix", suffix)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function resolveConversation(
  db: ServiceClient,
  phone: string,
  patientName: string,
): Promise<string> {
  return resolveOrCreateConversation(
    {
      findBySuffix: (suffix) => findConversationsBySuffix(db, suffix),
      async create(values) {
        const { data, error } = await db
          .from("whatsapp_conversations")
          .insert(values)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return { id: data.id };
      },
    },
    { phone, patientName },
  );
}

export type SendBillingPaymentRequestInput = {
  proposalId: string;
  patientKey: string;
  patientName: string;
  patientPhone: string;
  reservationId: string | null;
  amountEgp: number;
  description: string;
  /** The staff member who clicked "Request via WhatsApp". */
  sentBy: string | null;
};

export type SendBillingPaymentRequestResult =
  | { ok: true; requestId: string; via: "text" | "queued" }
  | { ok: false; error: string };

export async function sendBillingPaymentRequest(
  db: ServiceClient,
  input: SendBillingPaymentRequestInput,
): Promise<SendBillingPaymentRequestResult> {
  const settings = await loadDepositSettings(db);
  if (!settings) return { ok: false, error: "no_payment_settings" };
  if (!phoneSuffixForLookup(input.patientPhone)) {
    return { ok: false, error: "invalid_phone" };
  }

  const conversationId = await resolveConversation(db, input.patientPhone, input.patientName);

  const insertResult = await insertBillingPaymentRequest(db, {
    proposal_id: input.proposalId,
    patient_key: input.patientKey,
    patient_name: input.patientName,
    reservation_id: input.reservationId,
    conversation_id: conversationId,
    phone: input.patientPhone,
    amount_egp: input.amountEgp,
    description: input.description,
    settings_snapshot: {
      instapay_handle: settings.instapay_handle,
      wallet_number: settings.wallet_number,
    },
  });
  if (!insertResult.ok) {
    return {
      ok: false,
      error: insertResult.duplicate ? "already_awaiting_payment" : insertResult.error,
    };
  }
  const requestId = insertResult.id;

  const [{ data: conversation }, { data: lastInbound }] = await Promise.all([
    db
      .from("whatsapp_conversations")
      .select("contact_name,last_inbound_at")
      .eq("id", conversationId)
      .maybeSingle(),
    db
      .from("whatsapp_messages")
      .select("body,wa_timestamp")
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .order("wa_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const language = pickPatientLanguage({
    lastInboundBody: lastInbound?.body ?? "",
    patientName: conversation?.contact_name ?? input.patientName,
  });
  const openUntil = latestInboundAt(conversation?.last_inbound_at, [lastInbound?.wa_timestamp]);

  // The primaries from the payment-methods list, with the old single-field
  // settings as the fallback for a clinic that has not added any yet.
  const methods = await listPaymentMethods(db).catch(() => []);
  const to =
    destinationLine(methods) ||
    [settings.instapay_handle, settings.wallet_number]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" — ");

  const text = billingPaymentInstructions({
    amountEgp: input.amountEgp,
    description: input.description,
    destination: to,
    language,
  });

  if (isWhatsappSessionOpen(openUntil)) {
    try {
      const config = getKapsoConfig();
      await sendWhatsappMessage({
        service: db,
        client: createKapsoClient(),
        phoneNumberId: config.phoneNumberId,
        conversationId,
        sentBy: input.sentBy,
        // The clinic's own bookkeeping, not a human chatting — must not spend
        // the assistant's reply budget or trip the human_active gate.
        senderKind: "system",
        text,
      });
      return { ok: true, requestId, via: "text" };
    } catch (err) {
      // The window can close between reading it and sending. Fall through to
      // the queue below rather than failing the whole request.
      if (!(err instanceof WhatsappSessionClosedError)) {
        console.error("billing payment request failed to send", err);
      }
    }
  }

  const { error } = await db.from("patient_notifications").upsert(
    {
      kind: "billing_payment_request",
      dedupe_key: `${requestId}:billing_payment_request`,
      reservation_id: input.reservationId,
      phone: input.patientPhone,
      patient_name: input.patientName,
      service_label: `${input.description} — ${text}`.slice(0, 500),
      // What the template's {{2}} and {{3}} are filled from. Held apart from
      // service_label so the queued message can carry the destination too —
      // a patient who is only told what they owe has to ask where to send it,
      // and nothing answers that on its own.
      payload: {
        amount_label: formatEgp(input.amountEgp, language),
        description: input.description,
        destination: to,
      },
      starts_at: null,
      source: "manual",
      scheduled_for: new Date().toISOString(),
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) return { ok: false, error: error.message };

  return { ok: true, requestId, via: "queued" };
}

export type NotifyResult =
  | { sent: true; via: "text" }
  | {
      sent: false;
      reason: "no_conversation" | "not_found" | "send_failed" | "lookup_failed" | "session_closed";
    };

export type SendBillingConfirmation = (input: {
  db: ServiceClient;
  conversationId: string;
  text: string;
}) => Promise<void>;

const realSend: SendBillingConfirmation = async ({ db, conversationId, text }) => {
  const config = getKapsoConfig();
  await sendWhatsappMessage({
    service: db,
    client: createKapsoClient(),
    phoneNumberId: config.phoneNumberId,
    conversationId,
    sentBy: null,
    senderKind: "system",
    text,
  });
};

/**
 * Tell the patient their WhatsApp payment was confirmed by staff.
 *
 * Simpler than the deposit equivalent (notifyDecision.ts): there is no
 * approved "payment received" template to fall back to when the session is
 * closed, so this only ever sends free text and reports `session_closed`
 * rather than attempting one. Never throws — the confirmation is already
 * committed by the time this runs.
 */
export async function notifyBillingPaymentConfirmed(
  db: ServiceClient,
  requestId: string,
  send: SendBillingConfirmation = realSend,
  now: Date = new Date(),
): Promise<NotifyResult> {
  try {
    const { data: request } = await db
      .from("billing_payment_requests")
      .select("conversation_id,amount_egp")
      .eq("id", requestId)
      .maybeSingle();
    if (!request) return { sent: false, reason: "not_found" };

    const conversationId = request.conversation_id;
    if (!conversationId) return { sent: false, reason: "no_conversation" };

    const [{ data: conversation }, { data: lastInbound }] = await Promise.all([
      db
        .from("whatsapp_conversations")
        .select("contact_name,last_inbound_at")
        .eq("id", conversationId)
        .maybeSingle(),
      db
        .from("whatsapp_messages")
        .select("body,wa_timestamp")
        .eq("conversation_id", conversationId)
        .eq("direction", "inbound")
        .order("wa_timestamp", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const language = pickPatientLanguage({
      lastInboundBody: lastInbound?.body ?? "",
      patientName: conversation?.contact_name ?? "",
    });
    const openUntil = latestInboundAt(conversation?.last_inbound_at, [lastInbound?.wa_timestamp]);
    if (!isWhatsappSessionOpen(openUntil, now)) {
      return { sent: false, reason: "session_closed" };
    }

    const text = billingReceiptOutcomeMessage({
      reason: "ok",
      language,
      amountEgp: Number(request.amount_egp ?? 0),
    });
    await send({ db, conversationId, text });
    return { sent: true, via: "text" };
  } catch (err) {
    console.error("billing payment confirmation notify failed", err);
    return { sent: false, reason: "lookup_failed" };
  }
}

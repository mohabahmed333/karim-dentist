import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import type { createServiceClient } from "@/lib/supabase/service";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { sendWhatsappMessage } from "@/services/whatsapp/sendMessage";
import { receiptOutcomeMessage } from "./receiptMessages";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type NotifyResult =
  | { sent: true }
  | { sent: false; reason: "no_conversation" | "not_found" | "send_failed" };

/** Injectable so the decision can be tested without Kapso or a network. */
export type SendDeposit = (input: {
  db: ServiceClient;
  conversationId: string;
  text: string;
}) => Promise<void>;

const realSend: SendDeposit = async ({ db, conversationId, text }) => {
  const config = getKapsoConfig();
  await sendWhatsappMessage({
    service: db,
    client: createKapsoClient(),
    phoneNumberId: config.phoneNumberId,
    conversationId,
    sentBy: null,
    // "system", not "ai": the clinic's own bookkeeping talking. It must not
    // spend the assistant's reply budget or trip the human_active gate on the
    // patient's next message — the same choice the inbound receipt path makes.
    senderKind: "system",
    text,
  });
};

/**
 * Tell the patient their deposit was accepted.
 *
 * Staff confirming a receipt in the dashboard used to be silent: the row moved
 * to paid, the appointment was confirmed, and the patient — who had sent money
 * and was waiting to hear — got nothing at all. The automatic path had always
 * replied; only the human one had no voice.
 *
 * Never throws. The decision is already committed by the time this runs, so a
 * messaging failure must not turn a successful confirmation into an error on
 * the staff member's screen; it is reported back instead, so the UI can say the
 * patient still needs telling.
 */
export async function notifyDepositConfirmed(
  db: ServiceClient,
  requestId: string,
  send: SendDeposit = realSend,
): Promise<NotifyResult> {
  const { data: request } = await db
    .from("deposit_requests")
    .select("conversation_id,amount_egp")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { sent: false, reason: "not_found" };

  const conversationId = request.conversation_id;
  // A deposit taken over the phone has no WhatsApp thread to answer into.
  if (!conversationId) return { sent: false, reason: "no_conversation" };

  const [{ data: conversation }, { data: lastInbound }] = await Promise.all([
    db
      .from("whatsapp_conversations")
      .select("contact_name")
      .eq("id", conversationId)
      .maybeSingle(),
    db
      .from("whatsapp_messages")
      .select("body")
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

  const text = receiptOutcomeMessage({
    reason: "ok",
    language,
    amountEgp: Number(request.amount_egp ?? 0),
  });

  try {
    await send({ db, conversationId, text });
    return { sent: true };
  } catch (err) {
    // Outside Meta's 24-hour window this is the expected outcome, not a bug.
    console.error("deposit confirmation failed to send", err);
    return { sent: false, reason: "send_failed" };
  }
}

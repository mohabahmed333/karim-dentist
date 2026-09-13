import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { clinicContactFromSettings } from "@/lib/clinic/whatsappClinicContact";
import type { createServiceClient } from "@/lib/supabase/service";
import { pickPatientLanguage } from "@/services/patient_notifications/pickLanguage";
import { buildConfirmationTemplate } from "@/services/patient_notifications/templateParams";
import type { TemplateSendInput } from "@/services/whatsapp/sendKapso";
import {
  sendWhatsappMessage,
  WhatsappSessionClosedError,
} from "@/services/whatsapp/sendMessage";
import { isWhatsappSessionOpen, latestInboundAt } from "@/services/whatsapp/sessionWindow";
import { receiptOutcomeMessage } from "./receiptMessages";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type NotifyResult =
  | { sent: true; via: "text" | "template" }
  | {
      sent: false;
      reason:
        | "no_conversation"
        | "not_found"
        | "send_failed"
        | "lookup_failed"
        /**
         * The window is shut and the notification pipeline already holds the
         * approved confirmation for this appointment. Nothing was sent from
         * here because the patient is about to receive it from there.
         */
        | "confirmation_queued"
        /** The window is shut and there is nothing approved to say. */
        | "no_template";
    };

/** Injectable so the decision can be tested without Kapso or a network. */
export type SendDeposit = (input: {
  db: ServiceClient;
  conversationId: string;
  text?: string;
  template?: TemplateSendInput;
}) => Promise<void>;

const realSend: SendDeposit = async ({ db, conversationId, text, template }) => {
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
    template,
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
 * Which way it speaks depends on the clock. Staff confirm the morning after a
 * transfer as often as they confirm within the hour, and by then Meta's
 * 24-hour customer-care window has usually closed — free text is refused
 * outright, so the one message the patient most needs is the one most likely to
 * be blocked. Outside the window it goes as the clinic's approved confirmation
 * template instead, in whichever language the patient has been writing in.
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
  now: Date = new Date(),
): Promise<NotifyResult> {
  try {
    return await sendConfirmation(db, requestId, send, now);
  } catch (err) {
    // Every failure below is reported, never raised: the confirmation is
    // already committed, and a lookup that times out must not tell the staff
    // member their confirmation failed when it did not.
    console.error("deposit confirmation failed", err);
    return { sent: false, reason: "lookup_failed" };
  }
}

async function sendConfirmation(
  db: ServiceClient,
  requestId: string,
  send: SendDeposit,
  now: Date,
): Promise<NotifyResult> {
  const { data: request } = await db
    .from("deposit_requests")
    .select("conversation_id,amount_egp,reservation_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { sent: false, reason: "not_found" };

  const conversationId = request.conversation_id;
  // A deposit taken over the phone has no WhatsApp thread to answer into.
  if (!conversationId) return { sent: false, reason: "no_conversation" };

  const [{ data: conversation }, { data: lastInbound }, { data: reservation }, { data: settings }] =
    await Promise.all([
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
      db
        .from("reservations")
        .select("patient_name,service_label,starts_at")
        .eq("id", request.reservation_id)
        .maybeSingle(),
      db
        .from("site_settings")
        .select("contact_phone, contact_address, contact_clinic_name")
        .limit(1)
        .maybeSingle(),
    ]);

  const language = pickPatientLanguage({
    lastInboundBody: lastInbound?.body ?? "",
    patientName: conversation?.contact_name ?? "",
  });

  // The stored column and the newest inbound row can disagree by a webhook, and
  // being wrong in the optimistic direction is what gets a send refused — so
  // the later of the two decides.
  const openUntil = latestInboundAt(conversation?.last_inbound_at, [
    lastInbound?.wa_timestamp,
  ]);

  const template = buildTemplate({
    reservation,
    conversationName: conversation?.contact_name ?? "",
    clinicName: clinicContactFromSettings(settings).name,
    language,
  });

  if (!isWhatsappSessionOpen(openUntil, now)) {
    // Confirming the deposit flips the reservation to `confirmed`, and the
    // notification trigger queues the clinic's approved confirmation template
    // on exactly that transition — in the patient's own language, through the
    // pipeline that honours opt-outs and quiet hours. Sending our own copy
    // here would be the same template twice. So this only speaks when that row
    // is missing, which is the case for a booking that never went through the
    // deposit hold.
    const { data: queued } = await db
      .from("patient_notifications")
      .select("id")
      .eq("reservation_id", request.reservation_id)
      .eq("kind", "confirmation")
      .in("status", ["pending", "sending", "sent"])
      .limit(1)
      .maybeSingle();
    if (queued) return { sent: false, reason: "confirmation_queued" };

    if (!template) return { sent: false, reason: "no_template" };
    return attempt(send, { db, conversationId, template }, "template");
  }

  const text = receiptOutcomeMessage({
    reason: "ok",
    language,
    amountEgp: Number(request.amount_egp ?? 0),
  });

  try {
    await send({ db, conversationId, text });
    return { sent: true, via: "text" };
  } catch (err) {
    // The window can close between reading it and sending — a webhook we have
    // not stored yet, or a clock a minute out. The template is the answer to
    // exactly that refusal, so it is worth one attempt before giving up.
    if (err instanceof WhatsappSessionClosedError && template) {
      return attempt(send, { db, conversationId, template }, "template");
    }
    console.error("deposit confirmation failed to send", err);
    return { sent: false, reason: "send_failed" };
  }
}

async function attempt(
  send: SendDeposit,
  input: { db: ServiceClient; conversationId: string; template: TemplateSendInput },
  via: "text" | "template",
): Promise<NotifyResult> {
  try {
    await send(input);
    return { sent: true, via };
  } catch (err) {
    console.error("deposit confirmation failed to send", err);
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * The approved confirmation template, filled in from the reservation.
 *
 * Null when the booking it belongs to has gone — there is no honest template
 * send without a real appointment time in it, and inventing one is worse than
 * staff having to phone.
 */
function buildTemplate(input: {
  reservation: { patient_name: string; service_label: string; starts_at: string } | null;
  conversationName: string;
  clinicName: string;
  language: "ar" | "en";
}): TemplateSendInput | null {
  const { reservation } = input;
  if (!reservation?.starts_at) return null;
  try {
    return buildConfirmationTemplate({
      patientName: reservation.patient_name || input.conversationName,
      clinicName: input.clinicName,
      startsAt: reservation.starts_at,
      serviceLabel: reservation.service_label,
      language: input.language,
    });
  } catch {
    // templateFor throws when this clinic has nothing approved in that
    // language. Silence beats sending the wrong template.
    return null;
  }
}

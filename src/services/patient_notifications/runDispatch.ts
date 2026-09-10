/**
 * Drain the notification outbox.
 *
 * Wires the real dependencies and runs a bounded batch. Kept separate from
 * dispatchNotification so the decisions stay testable without a database, the
 * same split as processJob/runAutoReply.
 */

import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { clinicContactFromSettings } from "@/lib/clinic/whatsappClinicContact";
import type { createServiceClient } from "@/lib/supabase/service";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";
import { sendWhatsappMessage } from "@/services/whatsapp/sendMessage";
import { dispatchNotification, type DispatchOutcome } from "./dispatchNotification";
import { pickConversation, resolveOrCreateConversation } from "./resolveConversation";
import {
  claim,
  countSentLast24h,
  findDue,
  finish,
  isOptedOut,
  loadSettings,
  markSendStarted,
  sweepExpiredLeases,
} from "./store";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** One minute of cron at a time. Ample for a clinic, bounded for a cold start. */
const BATCH_SIZE = 10;

async function findConversationsBySuffix(db: ServiceClient, suffix: string) {
  const { data } = await db
    .from("whatsapp_conversations")
    .select("id,phone_number,updated_at")
    .eq("phone_suffix", suffix)
    .order("updated_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function runDispatch(
  db: ServiceClient,
  now: Date = new Date(),
): Promise<{ claimed: number; swept: number; outcomes: DispatchOutcome[] }> {
  const swept = await sweepExpiredLeases(db, now);
  const settings = await loadSettings(db);

  const [{ data: settingsRow }, due] = await Promise.all([
    db
      .from("site_settings")
      .select("contact_phone, contact_address, contact_clinic_name")
      .limit(1)
      .maybeSingle(),
    findDue(db, now, BATCH_SIZE),
  ]);
  const clinic = clinicContactFromSettings(settingsRow);

  let hasTransport = true;
  try {
    getKapsoConfig();
  } catch {
    hasTransport = false;
  }

  const outcomes: DispatchOutcome[] = [];
  let claimed = 0;

  for (const row of due) {
    // The conditional update is the lock: if another dispatcher took this row,
    // exactly one UPDATE matches and we move on.
    if (!(await claim(db, row.id, now, row.attempts))) continue;
    claimed += 1;

    outcomes.push(
      await dispatchNotification(
        {
          now: () => now,
          settings,
          clinicName: clinic.name,
          hasTransport,
          isOptedOut: (phone) => isOptedOut(db, phone),
          countSentLast24h: (phone) => countSentLast24h(db, phone, now),
          async lastInboundBody(phone) {
            const suffix = phoneSuffixForLookup(phone);
            if (!suffix) return null;
            const found = pickConversation(
              await findConversationsBySuffix(db, suffix),
              phone,
            );
            if (!found) return null;
            const { data } = await db
              .from("whatsapp_messages")
              .select("body")
              .eq("conversation_id", found.id)
              .eq("direction", "inbound")
              .order("wa_timestamp", { ascending: false })
              .limit(1)
              .maybeSingle();
            return data?.body ?? null;
          },
          resolveConversation: (input) =>
            resolveOrCreateConversation(
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
              input,
            ),
          markSendStarted: (id) => markSendStarted(db, id),
          async send({ conversationId, template }) {
            const config = getKapsoConfig();
            const message = await sendWhatsappMessage({
              service: db,
              client: createKapsoClient(),
              phoneNumberId: config.phoneNumberId,
              conversationId,
              // Nobody pressed send, so this must not read as a human reply.
              // `system` also keeps it out of the auto-responder's rate budget
              // and away from its `human_active` gate — see policy.ts. Calling
              // markHumanHandoff here would silence the assistant for exactly
              // the window in which the patient replies to the reminder.
              sentBy: null,
              senderKind: "system",
              template,
            });
            return { id: message.id };
          },
          finish: (id, patch) => finish(db, id, patch),
        },
        row,
      ),
    );
  }

  return { claimed, swept, outcomes };
}

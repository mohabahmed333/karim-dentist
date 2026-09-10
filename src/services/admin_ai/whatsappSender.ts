import { createKapsoClient, getKapsoConfig } from "@/lib/kapso/client";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWhatsappMessage } from "@/services/whatsapp/sendMessage";
import type { WhatsappSendFn } from "./adapterTypes";

/**
 * Real WhatsApp sender for the admin AI's whatsapp.* actions.
 *
 * Returns null when Kapso is not configured, so `ctx.sendWhatsapp` stays
 * undefined and the adapters fail with a clear message instead of throwing
 * a config error deep inside execute().
 */
export function createWhatsappSender(): WhatsappSendFn | undefined {
  let config: ReturnType<typeof getKapsoConfig>;
  try {
    config = getKapsoConfig();
  } catch {
    return undefined;
  }

  return async (input) => {
    const message = await sendWhatsappMessage({
      service: createServiceClient(),
      client: createKapsoClient(),
      phoneNumberId: config.phoneNumberId,
      conversationId: input.conversationId,
      sentBy: input.sentBy,
      text: input.text,
      template: input.template,
    });
    return { id: message.id };
  };
}

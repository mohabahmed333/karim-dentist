import { createClient } from "@/lib/supabase/client";
import type {
  WhatsappConversation,
  WhatsappMessage,
} from "@/services/whatsapp/types";

/**
 * One channel for every table the admin UI watches live.
 *
 * It started as the WhatsApp inbox's own channel and is still named for it;
 * a second socket per table would multiply reconnects and auth rebinds for no
 * gain, so new tables join here instead.
 */
export type AdminLiveEvent =
  | {
      table: "whatsapp_conversations";
      eventType: string;
      row: WhatsappConversation | null;
    }
  | {
      table: "whatsapp_messages";
      eventType: string;
      row: WhatsappMessage | null;
    }
  | {
      table: "treatment_proposals";
      eventType: string;
      row: { id: string; status: string } | null;
    }
  | {
      table: "inventory_alerts";
      eventType: string;
      row: { id: string; item_id: string } | null;
    }
  | {
      table: "reservations";
      eventType: string;
      row: { id: string; status: string; patient_name: string } | null;
    }
  | {
      table: "billing_payment_requests";
      eventType: string;
      row: { id: string; status: string; patient_name: string } | null;
    };

/** @deprecated Use {@link AdminLiveEvent}; kept for the inbox's imports. */
export type WhatsappLiveEvent = AdminLiveEvent;

type Listener = (event: AdminLiveEvent) => void;

const listeners = new Set<Listener>();
let started = false;
let retryTimer = 0;

function emit(event: AdminLiveEvent) {
  for (const listener of listeners) listener(event);
}

let authBound = false;

async function bindRealtimeAuth(
  supabase: ReturnType<typeof createClient>,
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) await supabase.realtime.setAuth(token);
  if (authBound) return;
  authBound = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    void supabase.realtime.setAuth(session?.access_token ?? "");
  });
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  void startChannel();
}

async function startChannel() {
  const supabase = createClient();
  await bindRealtimeAuth(supabase);
  const channel = supabase
    .channel("whatsapp-live-shared")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "whatsapp_conversations" },
      (payload) => {
        emit({
          table: "whatsapp_conversations",
          eventType: payload.eventType,
          row: (payload.new ?? payload.old) as WhatsappConversation | null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "whatsapp_messages" },
      (payload) => {
        emit({
          table: "whatsapp_messages",
          eventType: payload.eventType,
          row: (payload.new ?? payload.old) as WhatsappMessage | null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "treatment_proposals" },
      (payload) => {
        emit({
          table: "treatment_proposals",
          eventType: payload.eventType,
          row: (payload.new ?? payload.old) as {
            id: string;
            status: string;
          } | null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inventory_alerts" },
      (payload) => {
        emit({
          table: "inventory_alerts",
          eventType: payload.eventType,
          row: (payload.new ?? null) as { id: string; item_id: string } | null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      (payload) => {
        emit({
          table: "reservations",
          eventType: payload.eventType,
          row: (payload.new ?? null) as { id: string; status: string; patient_name: string } | null,
        });
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "billing_payment_requests" },
      (payload) => {
        emit({
          table: "billing_payment_requests",
          eventType: payload.eventType,
          row: (payload.new ?? null) as { id: string; status: string; patient_name: string } | null,
        });
      },
    )
    .subscribe((status) => {
      if (status !== "CHANNEL_ERROR" && status !== "TIMED_OUT") return;
      started = false;
      void supabase.removeChannel(channel);
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(start, 2000);
    });
}

export function subscribeWhatsappLive(listener: Listener): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
  };
}

/** Same channel, named for what it actually is now. */
export const subscribeAdminLive = subscribeWhatsappLive;

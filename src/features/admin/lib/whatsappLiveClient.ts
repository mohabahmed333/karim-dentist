import { createClient } from "@/lib/supabase/client";
import type {
  WhatsappConversation,
  WhatsappMessage,
} from "@/services/whatsapp/types";

export type WhatsappLiveEvent =
  | {
      table: "whatsapp_conversations";
      eventType: string;
      row: WhatsappConversation | null;
    }
  | {
      table: "whatsapp_messages";
      eventType: string;
      row: WhatsappMessage | null;
    };

type Listener = (event: WhatsappLiveEvent) => void;

const listeners = new Set<Listener>();
let started = false;
let retryTimer = 0;

function emit(event: WhatsappLiveEvent) {
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

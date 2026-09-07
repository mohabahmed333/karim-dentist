import type { Database } from "@/lib/supabase/database.types";

export type WhatsappConversation =
  Database["public"]["Tables"]["whatsapp_conversations"]["Row"];
export type WhatsappMessage =
  Database["public"]["Tables"]["whatsapp_messages"]["Row"];
export type WhatsappNote =
  Database["public"]["Tables"]["whatsapp_notes"]["Row"];

export type KapsoMessagePayload = {
  id?: string;
  timestamp?: string;
  type?: string;
  from?: string;
  text?: { body?: string };
  image?: { link?: string; url?: string; mime_type?: string; caption?: string };
  video?: { link?: string; url?: string; mime_type?: string; caption?: string };
  audio?: { link?: string; url?: string; mime_type?: string };
  document?: {
    link?: string;
    url?: string;
    mime_type?: string;
    filename?: string;
  };
  location?: {
    latitude?: number | string;
    longitude?: number | string;
    name?: string;
    address?: string;
  };
  interactive?: Record<string, unknown>;
  context?: {
    id?: string;
    from?: string;
  };
  kapso?: {
    direction?: string;
    status?: string;
    content?: string;
  };
};

export type KapsoConversationPayload = {
  id?: string;
  contact_name?: string;
  phone_number?: string;
  status?: string;
};

export type KapsoWebhookBody = {
  message?: KapsoMessagePayload;
  conversation?: KapsoConversationPayload;
  phone_number_id?: string;
  batch?: boolean;
  data?: KapsoWebhookBody[];
};

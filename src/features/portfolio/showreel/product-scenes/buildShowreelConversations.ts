import type { WhatsappConversation } from "@/services/whatsapp/types";
import { WHATSAPP_FIXTURE_CONVERSATIONS } from "./fixtures/whatsappConversations";

export function buildShowreelConversations(): WhatsappConversation[] {
  const now = new Date().toISOString();
  return WHATSAPP_FIXTURE_CONVERSATIONS.map((c, index) => ({
    id: c.id,
    kapso_conversation_id: `demo_${c.id}`,
    phone_number: c.phone.replace(/\D/g, ""),
    contact_name: c.name,
    patient_key: c.patientKey,
    status: c.status,
    last_message_at: now,
    last_inbound_at: c.lastInboundAt ?? now,
    last_message_preview: c.preview,
    last_message_type: c.lastMessageType ?? "text",
    last_message_status: c.lastMessageStatus ?? "received",
    unread_count: c.unread ? Number.parseInt(c.unread, 10) || 1 : 0,
    metadata: { is_demo: true, sort: index },
    created_at: now,
    updated_at: now,
  }));
}

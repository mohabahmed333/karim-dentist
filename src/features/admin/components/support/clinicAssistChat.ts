import type { ActivePatient } from "@/features/admin/components/chat/reception/flowTypes";
import type { SupportConversation } from "./supportDummyData";

/** Synthetic Front desk inbox id for embedded Clinic Assist. */
export const CLINIC_ASSIST_CHAT_ID = "__clinic-assist__";

/** Map a WhatsApp / inbox contact into Clinic Assist patient context. */
export function conversationToAssistPatient(
  conversation: SupportConversation,
): ActivePatient {
  const phone = conversation.phone?.trim() ?? "";
  return {
    patientKey: conversation.patientKey ?? `wa:${phone || conversation.id}`,
    name: conversation.name,
    phone,
    href: conversation.profileHref ?? conversation.workspaceHref,
  };
}

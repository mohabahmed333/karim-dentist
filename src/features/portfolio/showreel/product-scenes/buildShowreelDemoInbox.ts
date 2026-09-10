import {
  SUPPORT_CONVERSATIONS,
  SUPPORT_DETAILS,
  SUPPORT_MESSAGES,
} from "@/features/admin/components/support/supportDummyData";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";

export function buildShowreelDemoInbox(
  forcedSelectedId?: string,
): AdminDemoInbox {
  return {
    conversations: SUPPORT_CONVERSATIONS.map((c) => ({ ...c })),
    detailsById: SUPPORT_DETAILS,
    messagesById: Object.fromEntries(
      Object.entries(SUPPORT_MESSAGES).map(([id, msgs]) => [id, [...msgs]]),
    ),
    openCount: SUPPORT_CONVERSATIONS.length,
    forcedSelectedId,
  };
}

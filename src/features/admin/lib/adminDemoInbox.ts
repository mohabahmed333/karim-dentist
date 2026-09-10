import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
} from "@/features/admin/components/support/supportDummyData";

/** Offline inbox payload for showreel / demos — production leaves this unset. */
export type AdminDemoInbox = {
  conversations: SupportConversation[];
  detailsById: Record<string, SupportDetails>;
  messagesById: Record<string, SupportMessage[]>;
  openCount?: number;
  /** Keep a conversation selected (and open thread in compact). */
  forcedSelectedId?: string;
};

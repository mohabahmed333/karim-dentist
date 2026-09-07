export type ConversationLifecycleStatus = "active" | "ended" | "archived";

/**
 * Resolves next conversation.status for Kapso upserts.
 * Inbound on archived → active (auto-unarchive). Otherwise preserve archived.
 */
export function resolveConversationStatus(input: {
  existing?: ConversationLifecycleStatus | null;
  requested?: string | null;
  bumpUnread?: boolean;
}): ConversationLifecycleStatus {
  if (input.requested === "ended") return "ended";

  const existing = input.existing ?? null;
  if (existing === "archived") {
    if (input.bumpUnread) return "active";
    return "archived";
  }

  return "active";
}

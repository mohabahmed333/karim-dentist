import type { AdminAiChatMessage } from "./chatTypes";

type StoredClinicChat = {
  messages: AdminAiChatMessage[];
  updatedAt: string;
};

function storageKey(historyKey: string): string {
  return `dl-clinic-chat:${historyKey}`;
}

export function loadClinicChatHistory(
  historyKey: string,
): AdminAiChatMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(historyKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredClinicChat;
    if (!Array.isArray(parsed.messages)) return null;
    return parsed.messages.filter(
      (row) =>
        (row.role === "user" || row.role === "assistant") &&
        typeof row.content === "string",
    );
  } catch {
    return null;
  }
}

export function saveClinicChatHistory(
  historyKey: string,
  messages: AdminAiChatMessage[],
): void {
  if (typeof window === "undefined") return;
  try {
    const sanitized = messages.map((msg) => ({
      ...msg,
      imageUrls: msg.imageUrls?.filter((url) => !url.startsWith("blob:")),
    }));
    const payload: StoredClinicChat = {
      messages: sanitized,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      storageKey(historyKey),
      JSON.stringify(payload),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearClinicChatHistory(historyKey: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(historyKey));
  } catch {
    /* ignore */
  }
}

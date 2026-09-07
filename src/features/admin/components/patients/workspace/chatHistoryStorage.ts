import type { TreatmentAiDraft, TreatmentAiPoll } from "@/services/ai_groq";

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
  at?: string;
  imageUrls?: string[];
};

export type StoredChat = {
  messages: ChatTurn[];
  draft: TreatmentAiDraft | null;
  poll: TreatmentAiPoll | null;
  pollSelectedId: string | null;
  updatedAt: string;
};

function storageKey(patientKey: string, toothFdi: string): string {
  return `dl-treatment-chat:${patientKey}:${toothFdi}`;
}

export function loadChatHistory(
  patientKey: string,
  toothFdi: string,
): StoredChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(patientKey, toothFdi));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChat & { choices?: unknown };
    if (!Array.isArray(parsed.messages)) return null;
    return {
      messages: parsed.messages.filter(
        (row) =>
          (row.role === "user" || row.role === "assistant") &&
          typeof row.content === "string",
      ),
      draft: parsed.draft ?? null,
      poll: parsed.poll ?? null,
      pollSelectedId: parsed.pollSelectedId ?? null,
      updatedAt: parsed.updatedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function saveChatHistory(
  patientKey: string,
  toothFdi: string,
  data: Omit<StoredChat, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredChat = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(
      storageKey(patientKey, toothFdi),
      JSON.stringify(payload),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearChatHistory(patientKey: string, toothFdi: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(patientKey, toothFdi));
  } catch {
    /* ignore */
  }
}

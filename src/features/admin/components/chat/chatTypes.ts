export type AdminAiChatMessage = {
  /** The persisted row id, once the message has one — undefined before the thread exists. */
  id?: string;
  role: "user" | "assistant";
  content: string;
  at?: string;
  imageUrls?: string[];
  /** Staff thumbs up/down on an assistant reply. */
  feedback?: "up" | "down";
  meta?: {
    actions?: { id: string; label: string; payload?: Record<string, string> }[];
  };
};

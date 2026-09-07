export type AdminAiChatMessage = {
  role: "user" | "assistant";
  content: string;
  at?: string;
  imageUrls?: string[];
  meta?: {
    actions?: { id: string; label: string; payload?: Record<string, string> }[];
  };
};

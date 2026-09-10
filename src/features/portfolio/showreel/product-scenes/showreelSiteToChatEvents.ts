export const SHOWREEL_SITE_TO_CHAT_EVENT = "showreel-site-to-chat";

export type ShowreelSiteToChatDetail =
  | { type: "fill"; field: "name" | "phone" | "service" | "slot" }
  | { type: "submit" };

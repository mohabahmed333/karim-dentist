export const SHOWREEL_COMMAND_EVENT = "showreel-command-palette";
export const SHOWREEL_NAVIGATE_EVENT = "showreel-navigate";

export type ShowreelCommandDetail =
  | { type: "open" }
  | { type: "close" }
  | { type: "query"; query: string }
  | { type: "seed-demo" }
  | {
      type: "demo-hits";
      hits: {
        id: string;
        kind: string;
        title: string;
        subtitle?: string;
        href: string;
        keywords: string;
      }[];
    };

export type ShowreelNavigateDetail = {
  href: string;
  title: string;
  id: string;
  kind: string;
};

export function dispatchShowreelCommand(detail: ShowreelCommandDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SHOWREEL_COMMAND_EVENT, { detail }),
  );
}

export function dispatchShowreelNavigate(detail: ShowreelNavigateDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SHOWREEL_NAVIGATE_EVENT, { detail }),
  );
}

export const SHOWREEL_WHATSAPP_EVENT = "showreel-whatsapp";

export type ShowreelWhatsappDetail =
  | { type: "book" }
  | { type: "confirm-book" }
  | { type: "ask-ai" }
  | { type: "quick-replies" }
  | { type: "workspace" }
  | { type: "compose-message"; text: string }
  | { type: "send-message"; text: string }
  | { type: "voice-start" }
  | { type: "voice-send" };

export function dispatchShowreelWhatsapp(detail: ShowreelWhatsappDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SHOWREEL_WHATSAPP_EVENT, { detail }),
  );
}

export const SHOWREEL_CLINIC_DRAWER_CLOSE = "showreel-clinic-drawer-close";

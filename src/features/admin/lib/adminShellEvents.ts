/** Open WhatsApp / front-desk bubble from topbar New menu. */
export const ADMIN_OPEN_WHATSAPP_EVENT = "admin-open-whatsapp";

/** Payload of {@link ADMIN_OPEN_WHATSAPP_EVENT}. */
export type OpenWhatsappDetail = {
  /**
   * Conversation to select once the panel is open. Omitted opens the inbox
   * wherever it was left, which is what the topbar New menu wants.
   */
  conversationId?: string;
};

/** Close ⌘K so chat chrome is clickable after search. */
export const ADMIN_CLOSE_COMMAND_EVENT = "admin-close-command-palette";

/** Open a visit clinical note on the active patient workspace. */
export const ADMIN_OPEN_CLINICAL_NOTE_EVENT = "admin-open-clinical-note";

export function dispatchOpenWhatsapp(detail: OpenWhatsappDetail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenWhatsappDetail>(ADMIN_OPEN_WHATSAPP_EVENT, { detail }),
  );
}

export function dispatchCloseCommandPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_CLOSE_COMMAND_EVENT));
}

export function dispatchOpenClinicalNote() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_OPEN_CLINICAL_NOTE_EVENT));
}

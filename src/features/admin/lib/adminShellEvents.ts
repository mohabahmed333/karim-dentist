/** Open WhatsApp / front-desk bubble from topbar New menu. */
export const ADMIN_OPEN_WHATSAPP_EVENT = "admin-open-whatsapp";

/** Open a visit clinical note on the active patient workspace. */
export const ADMIN_OPEN_CLINICAL_NOTE_EVENT = "admin-open-clinical-note";

export function dispatchOpenWhatsapp() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_OPEN_WHATSAPP_EVENT));
}

export function dispatchOpenClinicalNote() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_OPEN_CLINICAL_NOTE_EVENT));
}

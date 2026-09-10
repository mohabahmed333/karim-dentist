export const SHOWREEL_CLINICAL_EVENT = "showreel-clinical";

export type ShowreelClinicalDetail =
  | { type: "select-tooth"; fdi: string }
  | { type: "tab"; tab: "chat" | "attachments" | "details" }
  | { type: "compose-note"; text: string }
  | { type: "attach-demo-images" }
  | { type: "send-note" };

export function dispatchShowreelClinical(detail: ShowreelClinicalDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(SHOWREEL_CLINICAL_EVENT, { detail }),
  );
}

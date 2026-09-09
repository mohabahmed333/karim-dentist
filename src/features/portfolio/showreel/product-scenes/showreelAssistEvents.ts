export const SHOWREEL_ASSIST_EVENT = "showreel-assist";

export type ShowreelAssistDetail =
  | { type: "compose-followup"; text: string }
  | { type: "send-followup" };

export function dispatchShowreelAssist(detail: ShowreelAssistDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SHOWREEL_ASSIST_EVENT, { detail }));
}

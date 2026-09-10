export const SHOWREEL_CUSTOMIZE_UI_EVENT = "showreel-customize-ui";

export type ShowreelCustomizeUiDetail =
  | { type: "device"; device: "desktop" | "tablet" | "mobile" }
  | { type: "locale"; locale: "en" | "ar" };

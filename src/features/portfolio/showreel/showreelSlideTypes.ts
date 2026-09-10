export type ShowreelCopySlide = {
  id: string;
  kind: "copy" | "outro";
  durationMs: number;
  kicker: string;
  title: string;
  body: string;
  tags?: string[];
};

export type ShowreelProductScene =
  | "ai-booking"
  | "whatsapp"
  | "clinical-ai"
  | "smart-ux"
  | "dashboard"
  | "site-to-chat";

export type ShowreelFeatureSlide = {
  id: string;
  kind: "feature";
  durationMs: number;
  kicker: string;
  title: string;
  body: string;
  tags: string[];
  desktopSrc: string;
  mobileSrc: string;
  scroll?: boolean;
  scrollDepth?: number;
  scrollMs?: number;
  scrollDelayMs?: number;
  scrollTarget?: string;
  scrollHeroFirst?: boolean;
  scrollHeroPhaseRatio?: number;
  desktopOnly?: boolean;
  /** Scripted customize demo played while this slide is active. */
  customizeScript?: "case-title" | "homepage-order" | "translate-all";
  /** Deterministic product wireframe scene (no live admin auth). */
  productScene?: ShowreelProductScene;
  requiresAiReview?: boolean;
};

export type ShowreelSlide = ShowreelCopySlide | ShowreelFeatureSlide;
export type ShowreelDeviceVariant = "desktop" | "mobile";

export type ShowreelCopySlide = {
  id: string;
  kind: "copy" | "outro";
  durationMs: number;
  kicker: string;
  title: string;
  body: string;
  tags?: string[];
};

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
  customizeScript?: "case-title" | "homepage-order";
};

export type ShowreelSlide = ShowreelCopySlide | ShowreelFeatureSlide;
export type ShowreelDeviceVariant = "desktop" | "mobile";

import type { CustomizeSection } from "../types";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
  ensureSection?: CustomizeSection;
  /** Force list view (no item / builder) */
  listView?: boolean;
  settingsTab?: "brand" | "contact" | "order";
};

export type TourGuide = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  steps: TourStep[];
};

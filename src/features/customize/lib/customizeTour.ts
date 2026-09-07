import { SECTION_TOUR_GUIDES } from "./sectionTourGuides";
import { SHELL_TOUR_GUIDES } from "./shellTourGuides";
import type { TourGuide } from "./tourTypes";

export type { TourGuide, TourStep } from "./tourTypes";

export const CUSTOMIZE_TOUR_STORAGE_KEY = "customize-tour-v3";

export const TOUR_GUIDES: TourGuide[] = [
  ...SHELL_TOUR_GUIDES,
  ...SECTION_TOUR_GUIDES,
];

export const DEFAULT_TOUR_GUIDE_ID = "overview";

export function getTourGuide(id: string): TourGuide | undefined {
  return TOUR_GUIDES.find((guide) => guide.id === id);
}

export function filterTourGuides(query: string): TourGuide[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOUR_GUIDES;
  return TOUR_GUIDES.filter((guide) => {
    const hay = [
      guide.title,
      guide.description,
      guide.id,
      ...guide.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function hasSeenCustomizeTour(): boolean {
  try {
    return window.localStorage.getItem(CUSTOMIZE_TOUR_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markCustomizeTourSeen(): void {
  try {
    window.localStorage.setItem(CUSTOMIZE_TOUR_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

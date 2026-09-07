export const CHARTING_TOUR_KEY = "charting.tourDismissed.v1";

export type ChartingTourStep = {
  id: "chart" | "diagnostics" | "planner";
  title: string;
  body: string;
};

export const CHARTING_TOUR_STEPS: readonly ChartingTourStep[] = [
  {
    id: "chart",
    title: "Chart the tooth",
    body: "Select a tooth. Decay and Filling paint one surface. Crown and Missing mark the whole tooth. Clear undoes that mark.",
  },
  {
    id: "diagnostics",
    title: "Read the tooth",
    body: "Select a tooth to open the inspector drawer for imaging, vitality, perio, and SOAP. Vitality and perio only save when you click Save to SOAP.",
  },
  {
    id: "planner",
    title: "Two taps to plan",
    body: "On the right planner, tap Fill, Crown, Root Canal, or Extract. Switch Immediate and Planned with one tap. Add a clinical note from any procedure card or the header.",
  },
];

export function shouldOpenChartingTour(stored: string | null): boolean {
  return stored !== "1";
}

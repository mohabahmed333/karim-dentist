export type HoverEntityType = "TOOTH" | "NODE" | "CARD";

export type HoveredEntity = {
  type: HoverEntityType;
  id: string;
} | null;

export type DashboardInteractionState = {
  selectedToothId: number | null;
  activeConditionId: string | null;
  expandedConditionId: string | null;
  timelineBounds: { startYear: number; endYear: number };
  zoomIndex: number;
  hoveredEntity: HoveredEntity;
  cbctOpen: boolean;
};

import type { DashboardWidgetId } from "@/features/admin/lib/dashboardLayout";
import type { DashboardDropEdge } from "@/features/admin/lib/dashboardDrop";

export const DASHBOARD_LAYOUT_STATE_EVENT = "admin-dashboard-layout-state";
export const DASHBOARD_LAYOUT_ACTION_EVENT = "admin-dashboard-layout-action";

export type DashboardLayoutUiState = {
  active: boolean;
  editing: boolean;
  dirty: boolean;
  saving: boolean;
  catalogOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  missing: DashboardWidgetId[];
};

export type DashboardLayoutAction =
  | { type: "toggleEdit" }
  | { type: "cancelEdit" }
  | { type: "save" }
  | { type: "reset" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "toggleCatalog" }
  | { type: "closeCatalog" }
  | { type: "add"; id: DashboardWidgetId }
  | {
      type: "move";
      fromId: DashboardWidgetId;
      targetId: DashboardWidgetId;
      edge: DashboardDropEdge;
    };

export const INACTIVE_DASHBOARD_LAYOUT_STATE: DashboardLayoutUiState = {
  active: false,
  editing: false,
  dirty: false,
  saving: false,
  catalogOpen: false,
  canUndo: false,
  canRedo: false,
  missing: [],
};

export function publishDashboardLayoutState(
  state: DashboardLayoutUiState,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_LAYOUT_STATE_EVENT, { detail: state }),
  );
}

export function dispatchDashboardLayoutAction(
  action: DashboardLayoutAction,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(DASHBOARD_LAYOUT_ACTION_EVENT, { detail: action }),
  );
}

export type ToothSeverity = "LOW" | "MED" | "HIGH" | "CRITICAL";
export type ToothSurface = "M" | "D" | "O" | "F" | "L" | "I";

export type ToothConditionInfo = {
  count: number;
  severity: ToothSeverity;
  surfaces?: ToothSurface[];
};

export type ViewMode =
  | "LATERAL"
  | "UPPER_OCCLUSAL"
  | "LOWER_OCCLUSAL"
  | "SINGLE_TOOTH";

export interface Dental3DModelProps {
  // Data & selection
  selectedToothId: number | null;
  toothConditions?: Record<number, ToothConditionInfo>;

  // Camera
  viewMode?: ViewMode;
  enableOrbitControls?: boolean;
  autoRotate?: boolean;

  // Theme
  highlightColor?: string;   // default #E2F163
  toothMeshColor?: string;   // default #F5F5F0
  gumMeshColor?: string;     // default #E5A2A2

  // Events
  onToothClick: (toothNumber: number) => void;
  onToothHover: (toothNumber: number | null) => void;
}

// Internal scene prop (stripped of Canvas-level stuff)
export interface SceneProps extends Required<
  Pick<
    Dental3DModelProps,
    | "selectedToothId"
    | "highlightColor"
    | "toothMeshColor"
    | "gumMeshColor"
    | "viewMode"
    | "enableOrbitControls"
    | "autoRotate"
    | "onToothClick"
    | "onToothHover"
  >
> {
  toothConditions: Record<number, ToothConditionInfo>;
}

export const SEVERITY_COLORS: Record<ToothSeverity, string> = {
  LOW:      "#4ade80",
  MED:      "#facc15",
  HIGH:     "#f97316",
  CRITICAL: "#ef4444",
};

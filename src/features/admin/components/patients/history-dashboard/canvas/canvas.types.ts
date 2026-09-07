export type ShapeSchema = {
  header?: string;
  badgeColor?: string;
  metrics?: { label: string; value: string }[];
  mediaGrid?: { label: string }[];
  barChartData?: { label: string; value: number; max?: number }[];
  footerBadge?: string;
  theme?: "dark" | "light";
};

export type MediaFile = {
  url: string;
  kind: "image" | "video";
};

export type CanvasNodeData = {
  date?: string;
  subtitle?: string;
  metric?: string;
  toothNumber?: number;
  visitType?: string;
  progressPercent?: number;
  drugs?: { name: string; timing: "day" | "night" | "both" }[];
  schema?: ShapeSchema;
  /** SHAPE_03: up to 4 uploaded media files (image or video) */
  mediaFiles?: MediaFile[];
};

export type CanvasNode = {
  id: string;
  x: number;
  y: number;
  shapeType: string;
  title: string;
  parentId: string | null;
  childrenIds: string[];
  data?: CanvasNodeData;
};

export type NodeSize = { width: number; height: number };

export type Viewport = { x: number; y: number; scale: number };

export type ShapeDefinition = {
  key: string;
  label: string;
  category: "core" | "schema";
  description: string;
  defaultTitle: string;
  defaultData?: CanvasNodeData;
};

export type AddNodePayload = {
  parentId: string | null;
  shapeType: string;
  title: string;
  data?: CanvasNodeData;
};

export type ContextMenuState = {
  nodeId: string;
  x: number;
  y: number;
} | null;

export type AddNodeDrawerState = {
  open: boolean;
  parentId: string | null;
};

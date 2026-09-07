import type { CanvasNodeData, ShapeDefinition, ShapeSchema } from "./canvas.types";

export const CORE_SHAPES: ShapeDefinition[] = [
  {
    key: "SHAPE_01",
    label: "Condition Source",
    category: "core",
    description: "Active pill + vitality sub-widget",
    defaultTitle: "Endodontic Infection",
  },
  {
    key: "SHAPE_02",
    label: "Metric Bento",
    category: "core",
    description: "Vitals + threshold dot chart",
    defaultTitle: "Office Visit: Pulpectomy",
    defaultData: { metric: "62–180 bpm / Vitality Index" },
  },
  {
    key: "SHAPE_03",
    label: "2×2 Media Grid",
    category: "core",
    description: "CBCT / X-ray quadrant previews",
    defaultTitle: "Office Visit: CBCT Scan",
  },
  {
    key: "SHAPE_04",
    label: "Stacked Document",
    category: "core",
    description: "Layered clinical notes + score badge",
    defaultTitle: "Office Visit: Endodontic Note",
  },
  {
    key: "SHAPE_05",
    label: "Diagnostic Pill",
    category: "core",
    description: "Light pill with date badge",
    defaultTitle: "Perio Probing Depth",
    defaultData: { date: "07.10" },
  },
  {
    key: "SHAPE_06",
    label: "Perio Depth Chart",
    category: "core",
    description: "1–8 mm pocket depth bars",
    defaultTitle: "Perio Probing Chart",
    defaultData: {
      schema: {
        header: "Pocket Depth (mm)",
        barChartData: [
          { label: "M", value: 3, max: 8 },
          { label: "B", value: 5, max: 8 },
          { label: "D", value: 2, max: 8 },
          { label: "L", value: 4, max: 8 },
        ],
      },
    },
  },
  {
    key: "SHAPE_07",
    label: "Lab Pipeline",
    category: "core",
    description: "5-stage fabrication progress",
    defaultTitle: "Zirconia Crown Fabrication",
    defaultData: { progressPercent: 83 },
  },
  {
    key: "SHAPE_08",
    label: "Prescription List",
    category: "core",
    description: "Drug cards with day/night icons",
    defaultTitle: "Active Prescriptions",
    defaultData: {
      drugs: [
        { name: "Amoxicillin 500mg", timing: "day" },
        { name: "Ibuprofen 600mg", timing: "both" },
      ],
    },
  },
];

function schemaForIndex(index: number): ShapeSchema {
  return {
    header: `Custom Diagnostic ${index}`,
    badgeColor: index % 2 === 0 ? "#E2F163" : "#FFFFFF",
    theme: index % 3 === 0 ? "dark" : "light",
    metrics: [
      { label: "Index", value: `${60 + (index % 40)}` },
      { label: "Range", value: `${index % 12}/${(index % 12) + 4}` },
    ],
    mediaGrid: [{ label: "Scan A" }, { label: "Scan B" }],
    barChartData: [
      { label: "A", value: (index % 7) + 1, max: 8 },
      { label: "B", value: (index % 5) + 2, max: 8 },
    ],
    footerBadge: `SHAPE_${String(index).padStart(3, "0")}`,
  };
}

const SCHEMA_SHAPES: ShapeDefinition[] = Array.from({ length: 92 }, (_, offset) => {
  const index = offset + 9;
  const key = `SHAPE_${String(index).padStart(3, "0")}`;
  return {
    key,
    label: `Schema ${index}`,
    category: "schema" as const,
    description: "JSON layout schema shape",
    defaultTitle: `Custom Node ${index}`,
    defaultData: { schema: schemaForIndex(index) },
  };
});

export const SHAPE_REGISTRY: ShapeDefinition[] = [...CORE_SHAPES, ...SCHEMA_SHAPES];

export function getShapeDefinition(key: string): ShapeDefinition | undefined {
  return SHAPE_REGISTRY.find((shape) => shape.key === key);
}

export function isSchemaShape(key: string): boolean {
  return key.startsWith("SHAPE_") && Number(key.replace("SHAPE_", "")) >= 9;
}

export function defaultDataForShape(key: string): CanvasNodeData | undefined {
  const shape = getShapeDefinition(key);
  if (!shape) return { schema: schemaForIndex(9) };
  return shape.defaultData ? { ...shape.defaultData } : undefined;
}

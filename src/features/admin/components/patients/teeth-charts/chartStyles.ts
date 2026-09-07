export type TeethChartStyle = "anatomic" | "arch" | "grid" | "circles";

export const TEETH_CHART_STYLES: {
  id: TeethChartStyle;
  label: string;
  hint: string;
}[] = [
  { id: "anatomic", label: "Anatomic", hint: "Realistic tooth outlines" },
  { id: "arch", label: "Arch", hint: "Curved U-shaped ellipses" },
  { id: "grid", label: "Grid", hint: "Quadrant rows by FDI" },
  { id: "circles", label: "Circles", hint: "Numbered clinical dots" },
];

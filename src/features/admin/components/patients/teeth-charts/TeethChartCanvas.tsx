"use client";

import { Odontogram } from "../Odontogram";
import { ArchEllipseChart } from "./ArchEllipseChart";
import { CirclesChart } from "./CirclesChart";
import { GridChart } from "./GridChart";
import type { TeethChartStyle } from "./chartStyles";

type ChartProps = {
  selectedFdi: string | null;
  hoveredFdi: string | null;
  commented: ReadonlySet<string>;
  onSelect: (fdi: string) => void;
  onHover: (fdi: string | null) => void;
  onDeselect: () => void;
};

type Props = ChartProps & { style: TeethChartStyle };

export function TeethChartCanvas({ style, ...chart }: Props) {
  // "model" is the 3D odontogram, which needs surface data this canvas is not
  // given — only the workspace renders it. Everywhere else it falls back to the
  // flat chart rather than rendering nothing.
  if (style === "anatomic" || style === "model") return <Odontogram {...chart} />;
  return (
    <div className="rounded-2xl bg-[var(--admin-hover)] px-4 py-5">
      {style === "arch" ? <ArchEllipseChart {...chart} /> : null}
      {style === "grid" ? <GridChart {...chart} /> : null}
      {style === "circles" ? <CirclesChart {...chart} /> : null}
    </div>
  );
}

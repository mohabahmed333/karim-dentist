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
  if (style === "anatomic") return <Odontogram {...chart} />;
  return (
    <div className="rounded-2xl bg-[#EEF2F6] px-4 py-5">
      {style === "arch" ? <ArchEllipseChart {...chart} /> : null}
      {style === "grid" ? <GridChart {...chart} /> : null}
      {style === "circles" ? <CirclesChart {...chart} /> : null}
    </div>
  );
}

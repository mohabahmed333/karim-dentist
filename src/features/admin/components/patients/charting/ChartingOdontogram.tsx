"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Dentition, NotationSystem } from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import { TeethChartCanvas } from "../teeth-charts/TeethChartCanvas";
import type { ChartingChartStyle } from "./chartingChartStyles";
import { SurfaceOdontogram } from "./SurfaceOdontogram";

type Props = {
  chartStyle: ChartingChartStyle;
  dentition: Dentition;
  notation: NotationSystem;
  selectedFdi: string | null;
  commented: ReadonlySet<string>;
  paintTool: PaintTool;
  byFdi: Map<string, SurfaceMap>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
};

export function ChartingOdontogram({
  chartStyle,
  dentition,
  notation,
  selectedFdi,
  commented,
  paintTool,
  byFdi,
  onSelect,
  onDeselect,
  onPaint,
}: Props) {
  const [hoveredFdi, setHoveredFdi] = useState<string | null>(null);

  if (chartStyle === "surfaces") {
    return (
      <SurfaceOdontogram
        dentition={dentition}
        notation={notation}
        selectedFdi={selectedFdi}
        tool={paintTool}
        byFdi={byFdi}
        onSelect={onSelect}
        onDeselect={onDeselect}
        onPaint={onPaint}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={chartStyle}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="mt-4 min-h-0 flex-1 overflow-auto"
      >
        <TeethChartCanvas
          style={chartStyle}
          selectedFdi={selectedFdi}
          hoveredFdi={hoveredFdi}
          commented={commented}
          onSelect={onSelect}
          onHover={setHoveredFdi}
          onDeselect={onDeselect}
        />
      </motion.div>
    </AnimatePresence>
  );
}

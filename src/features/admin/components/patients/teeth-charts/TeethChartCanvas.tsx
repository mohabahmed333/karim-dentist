"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
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

/**
 * One height for every shape.
 *
 * The four charts have wildly different intrinsic sizes — a 400×480 portrait
 * odontogram, a 200×170 landscape arch, a list of grid rows — so sizing to
 * content made the whole pane jump on every switch, and everything below it
 * moved. Fixing the box means only the drawing inside changes.
 */
export const TOOTH_CHART_HEIGHT = "h-[26rem]";

export function TeethChartCanvas({ style, ...chart }: Props) {
  const reduced = useReducedMotion();

  // "model" is the 3D odontogram, which needs surface data this canvas is not
  // given — only the workspace renders it. Everywhere else it falls back to the
  // flat chart rather than rendering nothing.
  const flat = style === "anatomic" || style === "model";

  return (
    <div className={cn("relative w-full overflow-hidden", TOOTH_CHART_HEIGHT)}>
      <AnimatePresence mode="wait" initial={false}>
        {/* Keyed on the shape so switching crossfades. The selected tooth is
            the parent's state, not this subtree's, so remounting here never
            drops it — the new shape paints with the same tooth already on. */}
        <motion.div
          key={style}
          className="absolute inset-0"
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          transition={{
            duration: reduced ? 0.12 : 0.22,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {flat ? (
            <Odontogram fill {...chart} />
          ) : (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[var(--admin-hover)] px-4 py-5">
              {style === "arch" ? <ArchEllipseChart {...chart} /> : null}
              {style === "grid" ? <GridChart {...chart} /> : null}
              {style === "circles" ? <CirclesChart {...chart} /> : null}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, type MotionValue } from "framer-motion";
import { DashboardDragGhost } from "@/features/admin/components/overview/DashboardDragGhost";
import {
  SHOWREEL_GHOST_OFFSET,
  type ShowreelCarryView,
} from "./showreelDragCarry";

export type ShowreelCursorView = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  arc: MotionValue<number>;
  tilt: MotionValue<number>;
  pressing: boolean;
  visible: boolean;
  beat: string | null;
  /** Set while the script is carrying something (scripted drag). */
  carry?: ShowreelCarryView | null;
};

/** Visible pointer + action caption for scripted showreel demos. */
export function ShowreelCursorOverlay({
  x,
  y,
  arc,
  tilt,
  pressing,
  visible,
  beat,
  carry = null,
}: ShowreelCursorView) {
  const ghostRef = useRef<HTMLDivElement>(null);

  // Synthetic drag events get no browser drag image, so the carried card is
  // ours to move. Written straight to the node (like the real drag ghost) —
  // a state update per frame would re-render the scene 60x a second.
  useEffect(() => {
    if (!carry) return;
    const write = () => {
      const node = ghostRef.current;
      if (!node) return;
      node.style.transform = `translate(${x.get() - SHOWREEL_GHOST_OFFSET}px, ${
        y.get() - SHOWREEL_GHOST_OFFSET
      }px)`;
    };
    write();
    const stopX = x.on("change", write);
    const stopY = y.on("change", write);
    return () => {
      stopX();
      stopY();
    };
  }, [carry, x, y]);

  return (
    <div className="showreel-cursor-layer" aria-hidden>
      <AnimatePresence mode="wait">
        {visible && beat ? (
          <motion.div
            key={beat}
            className="showreel-caption"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <span className="showreel-caption-dot" />
            <span className="showreel-caption-text">{beat}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* Not wrapped in a motion.div: an animated transform on an ancestor
          becomes the containing block for the ghost's own `fixed`
          positioning, which would offset it from the pointer. */}
      {visible && carry ? (
        <DashboardDragGhost
          ref={ghostRef}
          label={carry.label}
          width={carry.width}
          height={carry.height}
        />
      ) : null}
      <AnimatePresence>
        {visible ? (
          <motion.div
            className="showreel-cursor"
            style={{ x, y }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <motion.div className="showreel-cursor-arc" style={{ y: arc }}>
              <span className="showreel-cursor-halo" />
              <motion.svg
                className="showreel-cursor-arrow"
                style={{ rotate: tilt }}
                width="26"
                height="26"
                viewBox="0 0 26 26"
                fill="none"
                animate={{ scale: pressing ? 0.86 : 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 26 }}
              >
                <path
                  d="M5.6 3.3a1.1 1.1 0 0 1 1.6-1.2l14.1 8.2a1.1 1.1 0 0 1-.3 2l-6 1.4a1.1 1.1 0 0 0-.8.7l-2.3 6a1.1 1.1 0 0 1-2-.1L5.6 3.3Z"
                  fill="var(--sr-ink, #0f2744)"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </motion.svg>
              <AnimatePresence>
                {pressing ? (
                  <motion.span
                    className="showreel-cursor-ripple"
                    initial={{ opacity: 0.55, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 1.9 }}
                    exit={{ opacity: 0, scale: 1.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

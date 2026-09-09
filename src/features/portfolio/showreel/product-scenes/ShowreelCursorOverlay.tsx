"use client";

import { AnimatePresence, motion, type MotionValue } from "framer-motion";

export type ShowreelCursorView = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  arc: MotionValue<number>;
  tilt: MotionValue<number>;
  pressing: boolean;
  visible: boolean;
  beat: string | null;
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
}: ShowreelCursorView) {
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

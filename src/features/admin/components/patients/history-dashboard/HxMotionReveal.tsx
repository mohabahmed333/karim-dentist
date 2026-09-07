"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  children: ReactNode;
  className?: string;
};

export function HxMotionReveal({ visible, children, className }: Props) {
  return (
    <AnimatePresence mode="popLayout">
      {visible ? (
        <motion.div
          key="card"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={className}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

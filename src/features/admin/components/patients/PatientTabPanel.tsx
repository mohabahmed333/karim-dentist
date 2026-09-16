"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  patientTabTransition,
  patientTabVariants,
} from "@/features/admin/lib/patientTabMotion";

type Props = {
  /** Changing this is what plays the transition. */
  tab: string;
  className?: string;
  children: ReactNode;
};

/**
 * The animated body under a patient tab bar, shared by My Day and the record.
 *
 * `mode="wait"` rather than a crossfade: two odontograms on screen at once
 * during the swap reads as a glitch, and only one tab is ever mounted anyway.
 */
export function PatientTabPanel({ tab, className, children }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tab}
        className={className}
        variants={patientTabVariants(reduced)}
        initial="enter"
        animate="center"
        exit="exit"
        transition={patientTabTransition(reduced)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

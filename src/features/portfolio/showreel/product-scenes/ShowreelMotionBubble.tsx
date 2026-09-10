"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { CHAT_META } from "@/features/admin/components/chat/chatSkin";
import {
  chatTransition,
  messageVariants,
  workingVariants,
} from "@/features/admin/components/chat/chatMotion";
import { showreelBubbleClass } from "./showreelBubbleClass";

/**
 * A message bubble that fades/slides/scales in exactly like the real chat's
 * own messages (same messageVariants/chatTransition every scene's showreel
 * fixture reuses, instead of each one hand-rolling its own instant div).
 */
export function ShowreelMotionBubble({
  isUser,
  className = "",
  children,
}: {
  isUser?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={showreelBubbleClass(isUser, className)}
      custom={isUser}
      variants={messageVariants}
      initial="hidden"
      animate="show"
      transition={chatTransition(false)}
    >
      {children}
    </motion.div>
  );
}

/** The real "Working…" pulse (same workingVariants the production chat uses). */
export function ShowreelWorkingIndicator({ label }: { label: string }) {
  return (
    <motion.p
      className={`text-[12px] ${CHAT_META}`}
      variants={workingVariants}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      {label}
    </motion.p>
  );
}

/** A brief highlight ring/pulse for a "this just changed" story beat —
    a widget that was added, a card that just landed, a field that updated. */
export function ShowreelHighlightPulse({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ boxShadow: "0 0 0 0 rgba(94,106,210,0.5)", scale: 0.97 }}
      animate={{
        boxShadow: [
          "0 0 0 0 rgba(94,106,210,0.5)",
          "0 0 0 8px rgba(94,106,210,0)",
        ],
        scale: 1,
      }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

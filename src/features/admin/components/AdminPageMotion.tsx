"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  adminStaggerContainer,
  adminStaggerItem,
  adminStaggerItemReduced,
} from "@/features/admin/lib/adminPageMotion";

type Props = {
  children: ReactNode;
  className?: string;
  /**
   * Let the last child fill the height left over.
   *
   * Every child is wrapped in its own element so it can be staggered, and that
   * wrapper is a plain flex item — it sizes to its content. A page whose last
   * pane should reach the bottom (a tooth chart, a chat thread) therefore has
   * nothing to stretch against, however many `flex-1`s it sets on itself.
   */
  stretchLast?: boolean;
};

export function AdminPageMotion({
  children,
  className,
  stretchLast = false,
}: Props) {
  const reduced = useReducedMotion();
  const item = reduced ? adminStaggerItemReduced : adminStaggerItem;
  const items = Children.toArray(children);

  return (
    <motion.div
      data-admin-stagger=""
      className={className}
      variants={adminStaggerContainer}
      initial="hidden"
      animate="show"
    >
      {items.map((child, index) => (
        <motion.div
          key={index}
          variants={item}
          className={cn(
            "min-w-0",
            stretchLast &&
              index === items.length - 1 &&
              "flex min-h-0 flex-1 flex-col",
          )}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

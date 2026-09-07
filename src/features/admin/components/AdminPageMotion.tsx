"use client";

import { Children, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  adminStaggerContainer,
  adminStaggerItem,
  adminStaggerItemReduced,
} from "@/features/admin/lib/adminPageMotion";

type Props = {
  children: ReactNode;
  className?: string;
};

export function AdminPageMotion({ children, className }: Props) {
  const reduced = useReducedMotion();
  const item = reduced ? adminStaggerItemReduced : adminStaggerItem;

  return (
    <motion.div
      data-admin-stagger=""
      className={className}
      variants={adminStaggerContainer}
      initial="hidden"
      animate="show"
    >
      {Children.toArray(children).map((child, index) => (
        <motion.div key={index} variants={item} className="min-w-0">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

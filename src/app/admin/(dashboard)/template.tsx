"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  adminPageEnter,
  adminPageEnterReduced,
} from "@/features/admin/lib/adminPageMotion";
import { cn } from "@/lib/utils";

type Props = { children: ReactNode };

export default function AdminDashboardTemplate({ children }: Props) {
  const pathname = usePathname();
  const flushPage =
    pathname.startsWith("/admin/customize") ||
    pathname.startsWith("/admin/support");
  const reduced = useReducedMotion();
  const enter = reduced ? adminPageEnterReduced : adminPageEnter;

  return (
    <motion.div
      className={cn(
        "admin-page-enter",
        flushPage && "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
      )}
      initial={enter.initial}
      animate={enter.animate}
      transition={enter.transition}
    >
      {children}
    </motion.div>
  );
}

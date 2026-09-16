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
  /**
   * Pages that size themselves to the window rather than to their content.
   *
   * This wrapper sits between `main` and the page, so a plain block div here
   * ends the flex chain: the page's own `flex-1`/`h-full` then have an
   * auto-height parent to measure against and it collapses to its content —
   * which is what left My Day only as tall as whatever the tab happened to
   * hold, empty days included.
   */
  const flushPage = [
    "/admin/customize",
    "/admin/support",
    "/admin/my-day",
  ].some((route) => pathname.startsWith(route));
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

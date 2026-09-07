"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function SideDrawer({ open, title, onClose, children }: Props) {
  const drawer = useAdminDrawerSide();

  return (
    <AnimatePresence>
      {open ? (
        <div
          className={cn("fixed inset-0 z-50 flex", drawer.shellClass)}
          dir={drawer.shellDir}
        >
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            dir={drawer.contentDir}
            initial={{ x: drawer.offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: drawer.offscreenX }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "relative flex h-full w-full max-w-md flex-col bg-[var(--admin-panel,#ffffff)]",
              drawer.panelClass,
            )}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-base font-semibold text-[var(--admin-text,#111827)]">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-[var(--admin-hover,#f3f4f6)] px-3 py-1 text-sm text-[var(--admin-muted,#4b5563)]"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

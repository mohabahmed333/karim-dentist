"use client";

import type { ReactNode } from "react";
import { MessagesSquare } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  onActivate: () => void;
  menu?: ReactNode;
  menuOpen?: boolean;
  className?: string;
};

/** Collapsed edge rail — only launcher when docked (no floating FAB). */
export function AdminChatDockRail({
  label,
  onActivate,
  menu,
  menuOpen = false,
  className,
}: Props) {
  const t = useTranslations();

  return (
    <div className={cn("relative flex h-full shrink-0", className)}>
      {menuOpen && menu ? (
        <div className="absolute bottom-4 end-full z-[80] me-2">{menu}</div>
      ) : null}
      <button
        type="button"
        onClick={onActivate}
        aria-expanded={menuOpen}
        aria-haspopup={menu ? "menu" : undefined}
        aria-label={t("admin.bubbles.expandDock")}
        title={t("admin.bubbles.expandDock")}
        className="group flex h-full w-10 flex-col items-center gap-3 border-s border-[var(--admin-border)] bg-[var(--admin-panel)] py-3 text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
      >
        <span
          className="flex size-7 items-center justify-center rounded-full text-white shadow-sm"
          style={{ background: "var(--admin-primary)" }}
          aria-hidden
        >
          <MessagesSquare className="size-3.5" />
        </span>
        <span
          className="mt-1 max-h-[14rem] overflow-hidden text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
          }}
        >
          {label}
        </span>
      </button>
    </div>
  );
}

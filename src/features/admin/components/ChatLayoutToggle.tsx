"use client";

import { PanelLeftClose, PanelRight } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";

type Props = {
  layout: AdminChatLayout;
  onToggleLayout: () => void;
  onCollapseDock?: () => void;
  className?: string;
};

/** Float ⇄ dock (+ collapse when docked). Shared by Assist + WhatsApp headers. */
export function ChatLayoutToggle({
  layout,
  onToggleLayout,
  onCollapseDock,
  className,
}: Props) {
  const t = useTranslations();
  const docked = layout === "dock";

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5", className)}>
      {docked && onCollapseDock ? (
        <button
          type="button"
          onClick={onCollapseDock}
          data-showreel-action="chat-collapse"
          aria-label={t("admin.bubbles.collapseDock")}
          title={t("admin.bubbles.collapseDock")}
          className="rounded-lg p-1.5 text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
        >
          <PanelLeftClose className="size-4 rtl:rotate-180" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggleLayout}
        data-showreel-action="chat-layout-toggle"
        aria-label={
          docked ? t("admin.bubbles.switchToFloat") : t("admin.bubbles.switchToDock")
        }
        title={
          docked ? t("admin.bubbles.switchToFloat") : t("admin.bubbles.switchToDock")
        }
        className="rounded-lg p-1.5 text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
      >
        <PanelRight
          className={cn("size-4", docked && "text-[var(--admin-primary)]")}
        />
      </button>
    </div>
  );
}

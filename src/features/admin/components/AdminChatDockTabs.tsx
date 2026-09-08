"use client";

import { motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChatLayoutToggle } from "@/features/admin/components/ChatLayoutToggle";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";

export type DockChatTab = "whatsapp" | "assist";

type Props = {
  tab: DockChatTab;
  onTabChange: (tab: DockChatTab) => void;
  onCollapse: () => void;
  chatLayout: AdminChatLayout;
  onToggleChatLayout: () => void;
};

function WhatsAppTabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Dock chrome: WhatsApp | AI tabs + layout/collapse. */
export function AdminChatDockTabs({
  tab,
  onTabChange,
  onCollapse,
  chatLayout,
  onToggleChatLayout,
}: Props) {
  const t = useTranslations();

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-2 py-1.5">
      <div
        className="relative flex min-w-0 flex-1 rounded-lg bg-[#F3F4F6] p-0.5"
        role="tablist"
        aria-label={t("admin.bubbles.choose")}
      >
        <motion.div
          className="pointer-events-none absolute inset-y-0.5 rounded-md bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          animate={{ left: tab === "whatsapp" ? 2 : "50%" }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          style={{ width: "calc(50% - 2px)" }}
          aria-hidden
        />
        <button
          type="button"
          role="tab"
          aria-selected={tab === "whatsapp"}
          onClick={() => onTabChange("whatsapp")}
          className={cn(
            "relative z-[1] inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-colors",
            tab === "whatsapp"
              ? "text-[#111111]"
              : "text-[#70758A] hover:text-[#111111]",
          )}
        >
          <WhatsAppTabIcon className="size-3.5 shrink-0 text-[#25D366]" />
          <span className="truncate">{t("admin.frontDesk.title")}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "assist"}
          onClick={() => onTabChange("assist")}
          className={cn(
            "relative z-[1] inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-colors",
            tab === "assist"
              ? "text-[#111111]"
              : "text-[#70758A] hover:text-[#111111]",
          )}
        >
          <MessageCircle className="size-3.5 shrink-0" />
          <span className="truncate">{t("admin.chat.title")}</span>
        </button>
      </div>
      <ChatLayoutToggle
        layout={chatLayout}
        onToggleLayout={onToggleChatLayout}
        onCollapseDock={onCollapse}
      />
      <button
        type="button"
        onClick={onCollapse}
        aria-label={t("admin.bubbles.collapseDock")}
        className="rounded-lg p-1.5 text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

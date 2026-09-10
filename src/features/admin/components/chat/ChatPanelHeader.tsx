"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { ChatActionsMenu, type ChatHeaderAction } from "./ChatActionsMenu";
import { chatTransition } from "./chatMotion";
import { CHAT_HEADER } from "./chatSkin";
import { ChatLayoutToggle } from "@/features/admin/components/ChatLayoutToggle";
import type { AdminChatLayout } from "@/features/admin/hooks/useAdminChatLayout";

export type ChatPanelTab = "chat" | "attachments" | "details";

type TabDef = { id: ChatPanelTab; label: string };

type Props = {
  title: string;
  subtitle: string;
  tab?: ChatPanelTab;
  tabs?: TabDef[];
  onTabChange?: (tab: ChatPanelTab) => void;
  onViewProfile?: () => void;
  onClear?: () => void;
  canClear?: boolean;
  clearLabel?: string;
  onNewChat?: () => void;
  newChatLabel?: string;
  menuActions?: ChatHeaderAction[];
  onClose?: () => void;
  chatLayout?: AdminChatLayout;
  onToggleChatLayout?: () => void;
  onCollapseDock?: () => void;
};

export function ChatPanelHeader({
  title,
  subtitle,
  tab,
  tabs,
  onTabChange,
  onViewProfile,
  onClear,
  canClear,
  clearLabel,
  onNewChat,
  newChatLabel,
  menuActions,
  onClose,
  chatLayout,
  onToggleChatLayout,
  onCollapseDock,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const resolvedClear = clearLabel ?? t("admin.chat.clear");
  const resolvedNew = newChatLabel ?? t("admin.chat.newChat");
  return (
    <header className={`flex flex-col gap-2 ${CHAT_HEADER}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[#111111]">
            {title}
          </p>
          <p className="truncate text-[12px] text-[#70758A]">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onViewProfile ? (
            <button
              type="button"
              onClick={onViewProfile}
              className="rounded-xl bg-[#F3F4F6] px-3 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#E8EAED]"
            >
              {t("admin.chat.viewProfile")}
            </button>
          ) : null}
          {onNewChat ? (
            <motion.button
              type="button"
              transition={chatTransition(reduced, 0.2)}
              whileHover={reduced ? undefined : { scale: 1.03 }}
              whileTap={reduced ? undefined : { scale: 0.96 }}
              onClick={onNewChat}
              className="inline-flex items-center gap-1 rounded-xl bg-[#F3F4F6] px-2.5 py-1.5 text-[12px] font-medium text-[#111111] hover:bg-[#E8EAED]"
            >
              <Plus className="size-3.5" />
              {resolvedNew}
            </motion.button>
          ) : null}
          {menuActions && menuActions.length > 0 ? (
            <ChatActionsMenu actions={menuActions} />
          ) : canClear && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl px-2.5 py-1.5 text-[12px] font-medium text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
            >
              {resolvedClear}
            </button>
          ) : null}
          {chatLayout && onToggleChatLayout ? (
            <ChatLayoutToggle
              layout={chatLayout}
              onToggleLayout={onToggleChatLayout}
              onCollapseDock={onCollapseDock}
            />
          ) : null}
          {onClose ? (
            <button
              type="button"
              aria-label={t("admin.chat.close")}
              onClick={onClose}
              data-showreel-action="chat-close"
              className="rounded-lg p-1.5 text-[#70758A] hover:bg-[#F3F4F6] hover:text-[#111111]"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {tabs && tabs.length > 0 && tab && onTabChange ? (
        <div
          className="flex shrink-0 rounded-xl bg-[#F3F4F6] p-1"
          role="tablist"
          aria-label={t("admin.chat.panels")}
        >
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-showreel-action={`clinical-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "bg-white text-[#111111] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    : "text-[#70758A] hover:text-[#111111]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}

"use client";

import {
  ChatPanelHeader as SharedChatPanelHeader,
  type ChatPanelTab,
} from "@/features/admin/components/chat";
import { useTranslations } from "@/lib/i18n";

export type { ChatPanelTab };

type Props = {
  title: string;
  subtitle: string;
  tab: ChatPanelTab;
  onTabChange: (tab: ChatPanelTab) => void;
  onViewProfile?: () => void;
  onClear?: () => void;
  canClear?: boolean;
};

/** Treatment workspace header — shared shell + fixed Chat/Attachments/Details tabs. */
export function ChatPanelHeader(props: Props) {
  const t = useTranslations();
  const tabs: { id: ChatPanelTab; label: string }[] = [
    { id: "chat", label: t("admin.patients.chat") },
    { id: "attachments", label: t("admin.patients.attachments") },
    { id: "details", label: t("admin.patients.details") },
  ];
  return <SharedChatPanelHeader {...props} tabs={tabs} />;
}

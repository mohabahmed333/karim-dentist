"use client";

import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Calendar,
  ChevronLeft,
  ExternalLink,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";
import { useTranslations } from "@/lib/i18n";
import { SupportAvatar } from "./SupportAvatar";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatMessageBubble } from "./chat/ChatMessageBubble";
import type { ComposerSendPayload } from "./chat/composerTypes";
import { useChatScroll } from "./chat/useChatScroll";
import type {
  SupportConversation,
  SupportMessage,
} from "./supportDummyData";

type Props = {
  conversation: SupportConversation;
  messages: SupportMessage[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (payload: ComposerSendPayload) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  sending?: boolean;
  detailsOpen: boolean;
  onToggleDetails?: () => void;
  replyTo?: SupportMessage | null;
  onReply?: (message: SupportMessage) => void;
  onClearReply?: () => void;
  onArchiveToggle?: () => void;
  archiving?: boolean;
  onAskAi?: () => void;
  /** Show patient workspace CTA (full support page only). */
  showWorkspace?: boolean;
  /** Messenger-style back to conversation list. */
  onBack?: () => void;
};

export function SupportChatColumn({
  conversation,
  messages,
  draft,
  onDraftChange,
  onSend,
  onLoadMore,
  loadingMore,
  sending,
  detailsOpen,
  onToggleDetails,
  replyTo,
  onReply,
  onClearReply,
  onArchiveToggle,
  archiving,
  onAskAi,
  showWorkspace = true,
  onBack,
}: Props) {
  const t = useTranslations();
  const { openQuickBook } = useQuickBook();
  const archived = conversation.status === "archived";
  const { listRef } = useChatScroll(messages.length, {
    loadingMore: Boolean(loadingMore),
    onNearTop: () => {
      if (!onLoadMore || loadingMore) return;
      onLoadMore();
    },
  });

  function openAppointmentForClient() {
    toast.message(t("admin.frontDesk.newAppointment"), {
      description: t("admin.frontDesk.waConfirmHint"),
    });
    openQuickBook({
      waConversationId: conversation.id,
      name: conversation.name,
      phone: conversation.phone,
      patientKey: conversation.patientKey,
    });
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#F9FAFB]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
              aria-label={t("admin.frontDesk.backToChats")}
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
          ) : null}
          <SupportAvatar
            initials={conversation.initials}
            color={conversation.avatarColor}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">
              {conversation.name}
            </p>
            {conversation.phone ? (
              <p className="truncate text-xs text-[#6B7280]">
                {conversation.phone}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onAskAi ? (
            <button
              type="button"
              onClick={onAskAi}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--admin-primary)]/10 px-2.5 py-1.5 text-xs font-semibold text-[var(--admin-primary)] hover:bg-[var(--admin-primary)]/15"
              aria-label={t("admin.frontDesk.askAi")}
              title={t("admin.frontDesk.askAiTitle")}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {t("admin.frontDesk.askAi")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={openAppointmentForClient}
            className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label={t("admin.frontDesk.book")}
            title={t("admin.frontDesk.bookTitle")}
          >
            <Calendar className="h-4 w-4" />
          </button>
          {onArchiveToggle ? (
            <button
              type="button"
              onClick={onArchiveToggle}
              disabled={archiving}
              className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-50"
              aria-label={
                archived
                  ? t("admin.frontDesk.unarchiveAria")
                  : t("admin.frontDesk.archiveAria")
              }
              title={
                archived
                  ? t("admin.frontDesk.unarchive")
                  : t("admin.frontDesk.archive")
              }
            >
              {archived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
            </button>
          ) : null}
          {onToggleDetails ? (
            <button
              type="button"
              onClick={onToggleDetails}
              className={cn(
                "rounded-md p-1.5 text-[#6B7280] transition-colors hover:bg-[#F3F4F6]",
                detailsOpen && "bg-[#F3F4F6] text-[#111827]",
              )}
              aria-label={
                detailsOpen
                  ? t("admin.frontDesk.hideDetails")
                  : t("admin.frontDesk.showDetails")
              }
              aria-pressed={detailsOpen}
            >
              <PanelRight className="h-4 w-4" />
            </button>
          ) : null}
          {showWorkspace && conversation.workspaceHref ? (
            <Link
              href={conversation.workspaceHref}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("admin.frontDesk.workspace")}
            </Link>
          ) : null}
        </div>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
      >
        {loadingMore ? (
          <p className="text-center text-xs text-[#9CA3AF]">
            {t("admin.frontDesk.loadingEarlier")}
          </p>
        ) : null}
        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            message={m}
            onReply={onReply}
            booking={{
              conversationId: conversation.id,
              name: conversation.name,
              phone: conversation.phone,
              patientKey: conversation.patientKey,
            }}
          />
        ))}
      </div>

      <ChatComposer
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
        disabled={sending}
        replyTo={replyTo}
        onClearReply={onClearReply}
      />
    </section>
  );
}

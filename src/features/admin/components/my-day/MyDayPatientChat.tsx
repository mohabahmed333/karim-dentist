"use client";

import { useMemo, type CSSProperties } from "react";
import { ChatGalleryProvider } from "@/features/admin/components/support/chat/ChatGalleryContext";
import { ChatMessageBubble } from "@/features/admin/components/support/chat/ChatMessageBubble";
import { collectConversationMedia } from "@/features/admin/components/support/chat/collectConversationMedia";
import { useWhatsappTheme } from "@/features/admin/components/support/chat/theme/useWhatsappTheme";
import type { SupportMessage } from "@/features/admin/components/support/supportDummyData";
import { useTranslations } from "@/lib/i18n";

type Props = {
  messages: SupportMessage[];
  /** Null when this patient has no WhatsApp thread at all. */
  contactName: string | null;
};

/**
 * The patient's WhatsApp thread, read-only.
 *
 * Deliberately not the front-desk inbox: that one pages messages through an
 * API gated on `support.view`, which doctors don't have, and it shows every
 * conversation in the clinic. This renders one patient's messages, already
 * fetched server-side, with no composer — replying stays with reception.
 *
 * Borrows the inbox's bubbles as-is, which means borrowing two things they
 * quietly depend on: the `--wa-*` theme variables, and a gallery provider
 * that media bubbles call into when an image is tapped.
 */
export function MyDayPatientChat({ messages, contactName }: Props) {
  const t = useTranslations();
  const { vars } = useWhatsappTheme();
  const galleryImages = useMemo(
    () => collectConversationMedia(messages).images,
    [messages],
  );

  if (!contactName || messages.length === 0) {
    return (
      <div
        style={vars as CSSProperties}
        className="flex h-full min-h-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--wa-wallpaper-bg)] p-6"
      >
        <p className="max-w-[16rem] text-center text-sm text-[var(--admin-muted)]">
          {t("admin.myDay.noChat")}
        </p>
      </div>
    );
  }

  return (
    <ChatGalleryProvider images={galleryImages}>
      <section
        style={vars as CSSProperties}
        className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--wa-wallpaper-bg)]"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--wa-header-border)] bg-[var(--wa-header-bg)] px-4 py-2.5">
          <p className="truncate text-sm font-medium text-[var(--wa-header-text)]">
            {contactName}
          </p>
          <span className="shrink-0 text-[11px] text-[var(--admin-muted)]">
            {t("admin.myDay.chatReadOnly")}
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
          {messages.map((message) => (
            <ChatMessageBubble key={message.id} message={message} />
          ))}
        </div>
      </section>
    </ChatGalleryProvider>
  );
}

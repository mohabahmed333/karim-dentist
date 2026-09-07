"use client";

import { useTranslations } from "@/lib/i18n";
import { ChatComposerBar } from "./ChatComposerBar";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatThreadSkeleton } from "./ChatThreadSkeleton";
import { QuickActionBar } from "./reception/QuickActionBar";

type Props = {
  showClose?: boolean;
};

/**
 * Same tree as ReceptionChat when ready (no patient, chat tab):
 * header → panel → welcome thread → composer + QuickActionBar.
 */
export function ChatUiSkeleton({ showClose = false }: Props) {
  const t = useTranslations();
  return (
    <div
      className="pointer-events-none flex h-full min-h-0 flex-1 flex-col"
      aria-busy="true"
    >
      <ChatPanelHeader
        title={t("admin.chat.title")}
        subtitle={t("admin.chat.frontDesk")}
        onNewChat={() => undefined}
        menuActions={[
          {
            id: "clear",
            label: t("admin.chat.clearChat"),
            onClick: () => undefined,
          },
          {
            id: "history",
            label: t("admin.chat.historyTitle"),
            onClick: () => undefined,
          },
        ]}
        onClose={showClose ? () => undefined : undefined}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatThreadSkeleton />
        <ChatComposerBar
          value=""
          pending
          disabled
          placeholder={t("admin.chat.placeholder")}
          showAttach
          onOpenLibrary={() => undefined}
          onChange={() => undefined}
          onSend={() => undefined}
          topSlot={<QuickActionBar disabled onPick={() => undefined} />}
        />
      </div>
    </div>
  );
}

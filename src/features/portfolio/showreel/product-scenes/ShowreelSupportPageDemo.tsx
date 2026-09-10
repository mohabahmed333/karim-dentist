"use client";

import { SupportInboxView } from "@/features/admin/components/support";
import type { AdminDemoInbox } from "@/features/admin/lib/adminDemoInbox";
import { useTranslations } from "@/lib/i18n";

type Props = {
  inbox: AdminDemoInbox;
};

/** Full Front desk / WhatsApp page for showreel (not the bottom float). */
export function ShowreelSupportPageDemo({ inbox }: Props) {
  const t = useTranslations();
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col"
      data-showreel-action="whatsapp-page"
    >
      <SupportInboxView
        conversations={inbox.conversations}
        detailsById={inbox.detailsById}
        messagesById={inbox.messagesById}
        openCount={inbox.openCount ?? inbox.conversations.length}
        forcedSelectedId={inbox.forcedSelectedId}
        useKapso={false}
        agentName={t("admin.frontDesk.agentName")}
        panelVisible
      />
    </div>
  );
}

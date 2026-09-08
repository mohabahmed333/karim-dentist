"use client";

import Link from "next/link";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import { DASHBOARD_LIST_LIMIT, relativeTimeLabel } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";
import { dispatchOpenWhatsapp } from "@/features/admin/lib/adminShellEvents";

type Props = {
  conversations: WhatsappConversation[];
};

function displayName(row: WhatsappConversation): string {
  const name = row.contact_name?.trim();
  if (name) return name;
  return row.phone_number || "—";
}

export function DashboardMessagesPanel({ conversations }: Props) {
  const t = useTranslations();
  const rows = conversations.slice(0, DASHBOARD_LIST_LIMIT);
  const unreadTotal = rows.reduce((sum, row) => sum + (row.unread_count ?? 0), 0);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3.5">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-[var(--admin-text)]">
            {t("admin.overview.messages")}
          </h2>
          {unreadTotal > 0 ? (
            <span className="rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {unreadTotal}
            </span>
          ) : null}
        </div>
        <Link
          href="/admin/support"
          className="shrink-0 text-xs font-medium text-[var(--admin-primary)] hover:underline"
          onClick={() => dispatchOpenWhatsapp()}
        >
          {t("admin.overview.openFrontDesk")}
        </Link>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {rows.length === 0 ? (
          <li className="py-6 text-sm text-[var(--admin-muted)]">
            {t("admin.overview.noMessages")}
          </li>
        ) : (
          rows.map((row) => {
            const name = displayName(row);
            const unread = row.unread_count ?? 0;
            const when = row.last_message_at
              ? relativeTimeLabel(row.last_message_at)
              : "—";
            return (
              <li key={row.id}>
                <Link
                  href="/admin/support"
                  onClick={() => dispatchOpenWhatsapp()}
                  className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-start hover:bg-[var(--admin-hover)]"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-xs font-semibold text-[#128C7E]">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-[var(--admin-text)]">
                        {name}
                      </p>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--admin-muted)]">
                        {unread > 0 ? (
                          <span className="rounded-full bg-[#25D366] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {unread}
                          </span>
                        ) : null}
                        {when}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[var(--admin-muted)]">
                      {row.last_message_preview?.trim() ||
                        t("admin.overview.noMessagePreview")}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

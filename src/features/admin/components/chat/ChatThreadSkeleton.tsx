"use client";

import { AdminSkeleton as Block } from "@/features/admin/components/AdminSkeleton";
import { useTranslations } from "@/lib/i18n";

/** Welcome-thread bones — same markup as ReceptionChat’s first assistant message. */
export function ChatThreadSkeleton() {
  const t = useTranslations();
  return (
    <div
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3 sm:space-y-4 sm:px-4"
      aria-hidden
    >
      <div className="me-0 sm:me-2">
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-[var(--admin-muted)]">
            {t("admin.chat.reception")}
          </span>
          <Block className="h-2.5 w-10" />
        </div>
        <div className="w-full max-w-full min-w-0 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-[13px] leading-5 sm:px-3.5 sm:py-2.5">
          <div className="space-y-2">
            <Block className="h-3 w-full" />
            <Block className="h-3 w-[96%]" />
            <Block className="h-3 w-[88%]" />
            <Block className="h-3 w-[72%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

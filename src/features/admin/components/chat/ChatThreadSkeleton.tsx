"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useTranslations } from "@/lib/i18n";
import { CHAT_BUBBLE, CHAT_META } from "./chatSkin";

const bone = "bg-[#E8EAED]";

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
          <span className={`text-[11px] font-semibold ${CHAT_META}`}>
            {t("admin.chat.reception")}
          </span>
          <Skeleton className={`h-2.5 w-10 ${bone}`} />
        </div>
        <div className={CHAT_BUBBLE}>
          <div className="space-y-2">
            <Skeleton className={`h-3 w-full ${bone}`} />
            <Skeleton className={`h-3 w-[96%] ${bone}`} />
            <Skeleton className={`h-3 w-[88%] ${bone}`} />
            <Skeleton className={`h-3 w-[72%] ${bone}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

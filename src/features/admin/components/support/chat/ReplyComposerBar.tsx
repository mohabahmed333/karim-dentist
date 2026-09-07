"use client";

import { X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { ReplyQuoteData } from "./ReplyQuote";

type Props = {
  reply: ReplyQuoteData;
  onCancel: () => void;
};

export function ReplyComposerBar({ reply, onCancel }: Props) {
  const t = useTranslations();
  return (
    <div className="mb-2 flex items-start gap-2 rounded-lg border border-[#E5E7EB] border-l-[3px] border-l-[#D97706] bg-[#F9FAFB] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#B45309]">
          {t("admin.frontDesk.replyingTo").replace("{name}", reply.authorName)}
        </p>
        <p className="line-clamp-1 text-xs text-[#6B7280]">
          {reply.body || t("admin.frontDesk.message")}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="rounded p-1 text-[#6B7280] hover:bg-white"
        aria-label={t("admin.frontDesk.cancelReply")}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

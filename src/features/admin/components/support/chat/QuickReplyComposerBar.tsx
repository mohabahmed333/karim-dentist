"use client";

import { AlertTriangle, FileText, ImageIcon, MapPin, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import type { QuickReplyField } from "@/services/whatsapp/quickReplyFields";

type Props = {
  unfilled: QuickReplyField[];
  attachment: CannedReplyAttachment | null;
  onRemoveAttachment: () => void;
};

export function QuickReplyComposerBar({ unfilled, attachment, onRemoveAttachment }: Props) {
  const t = useTranslations();
  if (!unfilled.length && !attachment) return null;
  const Icon = attachment?.kind === "location" ? MapPin : attachment?.kind === "image" ? ImageIcon : FileText;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
      {unfilled.length ? (
        <p
          role="status"
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800 ring-1 ring-amber-200"
        >
          <AlertTriangle className="size-3.5" aria-hidden />
          {t("admin.frontDesk.fillInBeforeSending")}{" "}
          {unfilled.map((field) => t(`admin.quickReplies.field.${field}` as const)).join(", ")}
        </p>
      ) : null}
      {attachment ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[#374151] ring-1 ring-[#E5E7EB]">
          <Icon className="size-3.5" aria-hidden />
          {t("admin.frontDesk.quickReplyAttachment")}{" "}
          {attachment.kind === "location" ? t("admin.pages.quickReplies.attachLocation") : attachment.name}
          <button
            type="button"
            aria-label={t("admin.pages.quickReplies.attachRemove")}
            onClick={onRemoveAttachment}
            className="rounded-full p-0.5 hover:bg-black/5"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : null}
    </div>
  );
}

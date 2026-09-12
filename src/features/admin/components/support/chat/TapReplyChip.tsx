"use client";

import { MousePointerClick } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  flow: NonNullable<SupportMessage["flow"]>;
};

/**
 * What a patient tapped — a reply button or a list item — shown as a small
 * pill distinct from a normal message bubble, so it reads as a choice they
 * made rather than something they typed.
 */
export function TapReplyChip({ flow }: Props) {
  const t = useTranslations();
  const title = flow.title ?? "";
  return (
    <span
      role="status"
      aria-label={`${t("admin.frontDesk.tappedButton")} ${title}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#4338CA]"
    >
      <MousePointerClick className="h-3 w-3" />
      {title}
    </span>
  );
}

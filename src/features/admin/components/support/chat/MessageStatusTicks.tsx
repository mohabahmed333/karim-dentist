"use client";

import { AlertCircle, Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  status?: SupportMessage["status"];
  timestamps?: SupportMessage["statusTimestamps"];
};

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageStatusTicks({ status, timestamps }: Props) {
  const t = useTranslations();
  if (!status || status === "received") return null;

  const title = [
    `${t("admin.frontDesk.msgSent")}: ${fmt(timestamps?.sent_at)}`,
    `${t("admin.frontDesk.msgDelivered")}: ${fmt(timestamps?.delivered_at)}`,
    `${t("admin.frontDesk.msgRead")}: ${fmt(timestamps?.read_at)}`,
    timestamps?.failed_at
      ? `${t("admin.frontDesk.msgFailed")}: ${fmt(timestamps.failed_at)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (status === "pending") {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-0.5 text-[#9CA3AF]"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("admin.frontDesk.msgPending")}</span>
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-0.5 text-[#DC2626]"
      >
        <AlertCircle className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">{t("admin.frontDesk.msgFailed")}</span>
      </span>
    );
  }
  if (status === "sent") {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-0.5 text-[#6B7280]"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
        <span className="sr-only">{t("admin.frontDesk.msgSent")}</span>
      </span>
    );
  }
  if (status === "delivered") {
    return (
      <span
        title={title}
        className="inline-flex items-center gap-0.5 text-[#6B7280]"
      >
        <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
        <span className="sr-only">{t("admin.frontDesk.msgDelivered")}</span>
      </span>
    );
  }
  return (
    <span
      title={title}
      className={cn("inline-flex items-center gap-0.5 text-[#53BDEB]")}
    >
      <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden />
      <span className="sr-only">{t("admin.frontDesk.msgRead")}</span>
    </span>
  );
}

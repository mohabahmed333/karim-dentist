"use client";

import { FileText, ImageIcon, Scan, Stethoscope } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  chatResourceLabel,
  type ChatResourceKind,
  type ChatResourceStatus,
} from "./kinds";

type Props = {
  kind: ChatResourceKind;
  title: string;
  previewUrl?: string | null;
  href?: string | null;
  status?: ChatResourceStatus;
  size?: "sm" | "md";
  onRemove?: () => void;
};

export function ChatResourceTile({
  kind,
  title,
  previewUrl,
  href,
  status = "ready",
  size = "md",
  onRemove,
}: Props) {
  const t = useTranslations();
  const compact = size === "sm";
  const body = (
    <div
      className={`relative overflow-hidden border bg-white ${
        compact ? "w-16 rounded-xl" : "rounded-2xl"
      } ${status === "error" ? "border-[#FECACA]" : "border-[#E5E7EB]"}`}
    >
      <div
        className={`relative bg-[#F4F5F7] ${
          compact ? "aspect-square w-full" : "aspect-square w-full"
        }`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={title}
            className={`h-full w-full object-cover ${
              status === "uploading" ? "opacity-60" : ""
            }`}
          />
        ) : (
          <KindPlaceholder kind={kind} compact={compact} label={chatResourceLabel(kind, t)} />
        )}
        {status === "uploading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span
              className={`animate-spin rounded-full border-2 border-white border-t-transparent ${
                compact ? "size-3.5" : "size-5"
              }`}
            />
          </div>
        ) : null}
        {status === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FEF2F2]/85">
            <span className="text-[9px] font-semibold text-[#B91C1C]">!</span>
          </div>
        ) : null}
      </div>
      {!compact ? (
        <div className="border-t border-[#E5E7EB] px-2 py-1.5">
          <p className="truncate text-[11px] font-medium text-[#374151]">
            {title}
          </p>
          <p className="truncate text-[10px] text-[#9CA3AF]">
            {chatResourceLabel(kind, t)}
          </p>
        </div>
      ) : null}
      {onRemove && status !== "uploading" ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className={`absolute flex items-center justify-center rounded-full bg-black/55 text-white ${
            compact
              ? "top-0.5 end-0.5 size-4 text-[10px]"
              : "top-1.5 end-1.5 size-6 text-[12px]"
          }`}
          aria-label={t("admin.chat.remove")}
        >
          ×
        </button>
      ) : null}
    </div>
  );

  if (href && status === "ready") {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {body}
      </a>
    );
  }
  return body;
}

function KindPlaceholder({
  kind,
  compact,
  label,
}: {
  kind: ChatResourceKind;
  compact?: boolean;
  label: string;
}) {
  const Icon =
    kind === "xray"
      ? Stethoscope
      : kind === "cbct"
        ? Scan
        : kind === "file"
          ? FileText
          : ImageIcon;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[#9CA3AF]">
      <Icon className={compact ? "size-4" : "size-7"} strokeWidth={1.5} />
      {!compact ? (
        <span className="text-[10px] font-medium">{label}</span>
      ) : null}
    </div>
  );
}

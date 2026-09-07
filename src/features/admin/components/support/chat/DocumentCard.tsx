"use client";

import { Download, FileText } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

type Props = {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
};

function formatSize(size?: number) {
  if (!size) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({ url, name, size, mime }: Props) {
  const t = useTranslations();
  const ext =
    name?.split(".").pop()?.toUpperCase() ||
    mime?.split("/").pop()?.toUpperCase() ||
    "FILE";

  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#FEE2E2] text-[10px] font-bold text-[#B91C1C]">
        {ext.slice(0, 4)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[#111827]">
          {name ?? t("admin.frontDesk.document")}
        </p>
        <p className="text-[11px] text-[#6B7280]">
          {[ext, formatSize(size)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <a
        href={url || undefined}
        download={url ? name ?? "document" : undefined}
        target={url ? "_blank" : undefined}
        rel={url ? "noreferrer" : undefined}
        className={
          url
            ? "rounded p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
            : "pointer-events-none rounded p-1.5 text-[#D1D5DB]"
        }
        aria-label={t("admin.frontDesk.download")}
        onClick={(e) => {
          if (!url) e.preventDefault();
        }}
      >
        <Download className="h-4 w-4" />
      </a>
      <FileText className="h-4 w-4 text-[#9CA3AF]" aria-hidden />
    </div>
  );
}

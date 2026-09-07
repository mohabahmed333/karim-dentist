"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { CHAT_META } from "./chatSkin";

type Props = {
  url: string;
  index: number;
  total: number;
};

export function ChatMessageAttachment({ url, index, total }: Props) {
  const t = useTranslations();
  const label =
    total > 1
      ? t("admin.chat.clinicalPhotoOf")
          .replace("{index}", String(index + 1))
          .replace("{total}", String(total))
      : t("admin.chat.clinicalPhoto");

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative mt-2 inline-block w-full max-w-[168px] overflow-hidden rounded-xl bg-[#E8EAED]"
    >
      <div className="relative aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-full w-full object-cover"
        />
        <div className="absolute end-1.5 bottom-1.5 flex items-center gap-1 rounded-md bg-[#F8F9FB]/95 px-1.5 py-0.5">
          <span className={`text-[9px] font-medium ${CHAT_META}`}>{label}</span>
          <ExternalLink className={`size-2.5 ${CHAT_META}`} strokeWidth={1.75} />
        </div>
      </div>
    </a>
  );
}

export function ChatMessageAttachmentStack({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {urls.map((url, index) => (
        <ChatMessageAttachment
          key={`${url}-${index}`}
          url={url}
          index={index}
          total={urls.length}
        />
      ))}
    </div>
  );
}

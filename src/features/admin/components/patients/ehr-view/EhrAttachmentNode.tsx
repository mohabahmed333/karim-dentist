"use client";

import Image from "next/image";
import { EHR } from "./ehr.types";

export function EhrAttachmentNode({
  label,
  fileName,
  url,
  index,
}: {
  label: string;
  fileName: string;
  url: string;
  index: number;
}) {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(url) || label !== "File";
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="relative block w-[72px] shrink-0 overflow-hidden rounded-2xl border"
      style={{ background: EHR.card, borderColor: EHR.border }}
    >
      <div
        className="relative aspect-square w-full"
        style={{ background: EHR.soft }}
      >
        {isImage ? (
          <Image
            src={url}
            alt={fileName}
            fill
            className="object-cover"
            sizes="76px"
          />
        ) : (
          <span className="flex h-full items-center justify-center px-1 text-center text-[9px] font-medium">
            {label}
          </span>
        )}
      </div>
      <span
        className="absolute top-1 start-1 flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ background: EHR.ink }}
      >
        {index}
      </span>
      <p className="truncate px-1.5 py-1 text-[9px] text-[var(--admin-primary)]">{fileName}</p>
    </a>
  );
}

"use client";

import Image from "next/image";
import { Paperclip, Scan, X } from "lucide-react";
import {
  ATTACHMENT_FILE_ACCEPT,
  IMAGE_FILE_ACCEPT,
} from "@/lib/supabase/uploadHelpers";
import type { PatientTreatmentAttachment } from "@/services/patient_treatments";

type Props = {
  attachments: PatientTreatmentAttachment[];
  pendingFiles: { file: File; asXray: boolean }[];
  pending: boolean;
  onAddFiles: (files: FileList | File[], asXray: boolean) => void;
  onRemovePending: (index: number) => void;
  onRemoveSaved?: (id: string) => void;
};

export function TreatmentAttachmentsField({
  attachments,
  pendingFiles,
  pending,
  onAddFiles,
  onRemovePending,
  onRemoveSaved,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#f3f4f6] px-3 py-1.5 text-[12px] font-medium text-[#4b5563] hover:bg-[#e5e7eb]">
          <Paperclip className="size-3.5" />
          Attach file
          <input
            type="file"
            multiple
            accept={ATTACHMENT_FILE_ACCEPT}
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files, false);
              e.target.value = "";
            }}
          />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#E0F2FE] px-3 py-1.5 text-[12px] font-medium text-[#075985] hover:bg-[#bae6fd]">
          <Scan className="size-3.5" />
          Add X-ray
          <input
            type="file"
            multiple
            accept={IMAGE_FILE_ACCEPT}
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              if (e.target.files?.length) onAddFiles(e.target.files, true);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {attachments.length > 0 || pendingFiles.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((file) => (
            <AttachmentRow
              key={file.id}
              name={file.file_name}
              url={file.file_url}
              kind={file.kind}
              isImage={file.kind === "image" || file.kind === "xray"}
              onRemove={
                onRemoveSaved ? () => onRemoveSaved(file.id) : undefined
              }
            />
          ))}
          {pendingFiles.map((item, index) => (
            <AttachmentRow
              key={`${item.file.name}-${index}`}
              name={item.file.name}
              kind={item.asXray ? "xray" : "file"}
              isImage={item.asXray || item.file.type.startsWith("image/")}
              onRemove={() => onRemovePending(index)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-[#9ca3af]">
          Attach docs or X-rays. X-rays also appear on the X-ray tab.
        </p>
      )}
    </div>
  );
}

function AttachmentRow({
  name,
  url,
  kind,
  isImage,
  onRemove,
}: {
  name: string;
  url?: string;
  kind: string;
  isImage: boolean;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-[#f2f2f2] px-2 py-1.5 text-[12px] text-[#4b5563]">
      {isImage && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
          <Image
            src={url}
            alt={name}
            width={36}
            height={36}
            className="size-9 rounded object-cover"
          />
        </a>
      ) : (
        <span className="flex size-9 items-center justify-center rounded bg-white text-[10px] font-semibold uppercase text-[#6b7280]">
          {kind === "xray" ? "XR" : "DOC"}
        </span>
      )}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate hover:underline"
        >
          {name}
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate">{name}</span>
      )}
      <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
        {kind}
      </span>
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label="Remove">
          <X className="size-3.5 text-[#9ca3af]" />
        </button>
      ) : null}
    </li>
  );
}

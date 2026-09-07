"use client";

import Image from "next/image";
import { Paperclip } from "lucide-react";
import type { PatientTreatmentAttachment } from "@/services/patient_treatments";

type Props = {
  attachments: PatientTreatmentAttachment[];
};

export function TreatmentAttachmentsPreview({ attachments }: Props) {
  return (
    <div className="rounded-xl bg-white px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">
        <Paperclip className="size-3" />
        Attachments · {attachments.length}
      </p>
      <ul className="flex flex-wrap gap-2">
        {attachments.map((file) => {
          const visual = file.kind === "image" || file.kind === "xray";
          return (
            <li key={file.id}>
              <a
                href={file.file_url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg bg-[#f2f2f2]"
                title={file.file_name}
              >
                {visual ? (
                  <Image
                    src={file.file_url}
                    alt={file.file_name}
                    width={72}
                    height={72}
                    className="size-[72px] object-cover"
                  />
                ) : (
                  <span className="flex size-[72px] flex-col items-center justify-center gap-1 px-1 text-center text-[10px] text-[#6b7280]">
                    <span className="font-semibold uppercase">{file.kind}</span>
                    <span className="line-clamp-2">{file.file_name}</span>
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

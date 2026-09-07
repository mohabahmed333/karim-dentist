"use client";

import Image from "next/image";
import { ClipboardList } from "lucide-react";
import type { TreatmentItem } from "@/services/patient_treatments";
import { isRichTextEmpty, RichTextHtml } from "./richTextUtils";

type Props = {
  treatments: TreatmentItem[];
};

export function PatientTreatmentHistory({ treatments }: Props) {
  if (treatments.length === 0) {
    return (
      <section>
        <h3 className="mb-3 text-sm font-medium text-[#0f2744]">
          Treatment history
        </h3>
        <p className="rounded-2xl bg-[#fafafa] px-4 py-6 text-center text-sm text-[#9ca3af]">
          No required treatments recorded yet.
        </p>
      </section>
    );
  }

  const sorted = [...treatments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[#0f2744]">
        <ClipboardList className="size-4 text-[#6b7280]" />
        Treatment history ({sorted.length})
      </h3>
      <ul className="space-y-3">
        {sorted.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl bg-[#fafafa] px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#0f2744]">
                {item.toothName}
                {item.toothFdi ? (
                  <span className="ms-1 font-normal text-[#9ca3af]">
                    · {item.toothFdi}
                  </span>
                ) : null}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  item.severity === "Critical"
                    ? "bg-[#FEE2E2] text-[#991B1B]"
                    : "bg-[#FEF3C7] text-[#92400E]"
                }`}
              >
                {item.severity}
              </span>
              {item.appointment?.status === "confirmed" ? (
                <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                  Confirmed appt
                </span>
              ) : item.status === "scheduled" ? (
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                  Scheduled
                </span>
              ) : null}
              <span className="ms-auto text-[11px] text-[#9ca3af]">
                {formatDate(item.createdAt)}
              </span>
            </div>

            {!isRichTextEmpty(item.lastTreatment) ? (
              <div className="mt-2 text-[12px] text-[#4b5563]">
                <RichTextHtml html={item.lastTreatment} />
              </div>
            ) : null}

            {item.appointment ? (
              <p className="mt-2 text-[12px] text-[#4b5563]">
                Appointment:{" "}
                {formatDate(item.appointment.startsAt)} ·{" "}
                {item.appointment.serviceLabel}
              </p>
            ) : null}

            {item.attachments.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.attachments.map((file) => {
                  const visual =
                    file.kind === "image" || file.kind === "xray";
                  return (
                    <li key={file.id}>
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg bg-white"
                        title={`${file.kind}: ${file.file_name}`}
                      >
                        {visual ? (
                          <Image
                            src={file.file_url}
                            alt={file.file_name}
                            width={64}
                            height={64}
                            className="size-16 object-cover"
                          />
                        ) : (
                          <span className="flex size-16 items-center justify-center px-1 text-center text-[10px] text-[#6b7280]">
                            {file.file_name}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

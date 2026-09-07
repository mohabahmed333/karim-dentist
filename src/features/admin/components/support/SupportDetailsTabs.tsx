"use client";

import { useState } from "react";
import { FileText, Film, Link2, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import {
  collectConversationMedia,
  type MediaAttachmentItem,
} from "./chat/collectConversationMedia";
import { SupportDetailsSections } from "./SupportDetailsSections";
import type { SupportDetails, SupportMessage } from "./supportDummyData";

type Tab = "details" | "images" | "links" | "attachments";

type Props = {
  details: SupportDetails;
  messages: SupportMessage[];
  accordionOpen: Record<string, boolean>;
  onToggleAccordion: (key: string) => void;
  onAddNote?: (body: string) => void | Promise<void>;
  onTogglePinNote?: (id: string, pinned: boolean) => void | Promise<void>;
  onEditNote?: (id: string, body: string) => void | Promise<void>;
  onDeleteNote?: (id: string) => void | Promise<void>;
};

const TAB_KEYS: { id: Tab; key: AdminMessageKey }[] = [
  { id: "details", key: "admin.frontDesk.tab.details" },
  { id: "images", key: "admin.frontDesk.tab.images" },
  { id: "links", key: "admin.frontDesk.tab.links" },
  { id: "attachments", key: "admin.frontDesk.tab.attachments" },
];

function attachmentIcon(kind: MediaAttachmentItem["kind"]) {
  if (kind === "video") return Film;
  if (kind === "audio") return Music;
  return FileText;
}

export function SupportDetailsTabs({
  details,
  messages,
  accordionOpen,
  onToggleAccordion,
  onAddNote,
  onTogglePinNote,
  onEditNote,
  onDeleteNote,
}: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("details");
  const { images, attachments, links } = collectConversationMedia(messages);
  const counts: Partial<Record<Tab, number>> = {
    images: images.length,
    links: links.length,
    attachments: attachments.length,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 border-b border-[#E5E7EB] px-1">
        {TAB_KEYS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 border-b-2 px-0.5 py-2.5 text-[10px] font-semibold transition-colors sm:text-[11px]",
              tab === item.id
                ? "border-[#111827] text-[#111827]"
                : "border-transparent text-[#6B7280] hover:text-[#111827]",
            )}
          >
            {t(item.key)}
            {counts[item.id] ? (
              <span className="ms-0.5 text-[#9CA3AF]">{counts[item.id]}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "details" ? (
          <SupportDetailsSections
            details={details}
            open={accordionOpen}
            onToggle={onToggleAccordion}
            onAddNote={onAddNote}
            onTogglePinNote={onTogglePinNote}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
          />
        ) : null}

        {tab === "images" ? (
          <div className="px-3 py-3">
            {images.length === 0 ? (
              <Empty label={t("admin.frontDesk.noImages")} />
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square overflow-hidden rounded-md bg-[#F3F4F6]"
                    title={img.name || t("admin.frontDesk.image")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name || t("admin.frontDesk.image")}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "links" ? (
          <div className="px-3 py-3">
            {links.length === 0 ? (
              <Empty label={t("admin.frontDesk.noLinks")} />
            ) : (
              <ul className="space-y-1.5">
                {links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-2 rounded-md border border-[#E5E7EB] px-2 py-1.5 hover:bg-[#F9FAFB]"
                    >
                      <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-[#111827]">
                          {link.label}
                        </span>
                        <span className="block truncate text-[10px] text-[#9CA3AF]">
                          {link.url}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "attachments" ? (
          <div className="px-3 py-3">
            {attachments.length === 0 ? (
              <Empty label={t("admin.frontDesk.noAttachments")} />
            ) : (
              <ul className="space-y-1.5">
                {attachments.map((file) => {
                  const Icon = attachmentIcon(file.kind);
                  return (
                    <li key={file.id}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md border border-[#E5E7EB] px-2 py-1.5 hover:bg-[#F9FAFB]"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F3F4F6] text-[#374151]">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-[#111827]">
                          {file.name}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-xs text-[#9CA3AF]">{label}</p>;
}

"use client";

import { Reply } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { MessageMediaGrid } from "./MessageMediaGrid";
import { MessageVideo } from "./MessageVideo";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import { DocumentCard } from "./DocumentCard";
import {
  FlowMessageCard,
  type FlowBookingContext,
} from "./FlowMessageCard";
import { InteractiveOutboundCard } from "./InteractiveOutboundCard";
import { MessageStatusTicks } from "./MessageStatusTicks";
import { ReplyQuote } from "./ReplyQuote";
import { formatWhatsappText } from "./formatWhatsappText";
import { textDirection } from "./textDirection";
import type { SupportMessage } from "../supportDummyData";
import { cn } from "@/lib/utils";

type Props = {
  message: SupportMessage;
  booking?: FlowBookingContext;
  onReply?: (message: SupportMessage) => void;
  highlighted?: boolean;
};

function isImage(mime?: string, type?: string) {
  return (
    (mime ?? "").startsWith("image/") ||
    type === "image" ||
    type === "sticker"
  );
}
function isVideo(mime?: string, type?: string) {
  return (mime ?? "").startsWith("video/") || type === "video";
}
function isAudio(mime?: string, type?: string) {
  return (
    (mime ?? "").startsWith("audio/") || type === "audio" || type === "voice"
  );
}
function isDoc(mime?: string, type?: string) {
  return type === "document" || (mime ?? "").includes("pdf");
}

function isUnsupported(m: SupportMessage): boolean {
  const type = (m.messageType ?? "").toLowerCase();
  if (type === "unsupported" || type === "unknown") return true;
  return /unsupported message|error\s*131051/i.test(m.body ?? "");
}

/** Inbound button/list taps stored with a fake Flow payload — show text only. */
function isButtonOrListReplyFlow(
  flow: NonNullable<SupportMessage["flow"]>,
): boolean {
  if (flow.kind && flow.kind !== "flow") return false;
  const title = (flow.title ?? "").toLowerCase();
  return title === "button_reply" || title === "list_reply";
}

export function ChatMessageBubble({
  message: m,
  booking,
  onReply,
  highlighted = false,
}: Props) {
  const t = useTranslations();
  const isAgent = m.author === "agent";
  const media = m.media ?? [];
  const unsupported = isUnsupported(m);
  const images = media.filter((x) => isImage(x.mime, m.messageType) && x.url);
  const videos = media.filter((x) => isVideo(x.mime, m.messageType) && x.url);
  const audios = media.filter((x) => isAudio(x.mime, m.messageType) && x.url);
  const docs = media.filter((x) => isDoc(x.mime, m.messageType));
  const interactiveKinds = new Set([
    "buttons",
    "cta",
    "location",
    "contacts",
  ]);
  const showFlowCard =
    m.flow &&
    (!m.flow.kind || m.flow.kind === "flow") &&
    !isButtonOrListReplyFlow(m.flow);
  const showInteractive =
    m.flow && m.flow.kind && interactiveKinds.has(m.flow.kind);
  const hideBody =
    unsupported ||
    /unsupported message|error\s*131051/i.test(m.body ?? "") ||
    m.messageType === "location" ||
    m.flow?.kind === "location" ||
    m.flow?.kind === "contacts";
  const body = hideBody ? "" : m.body;
  const bodyDir = textDirection(body || "");

  function startReply() {
    if (!onReply) return;
    if (!m.kapsoWamid) {
      toast.message(t("admin.frontDesk.cantReply"), {
        description: t("admin.frontDesk.cantReplyHint"),
      });
      return;
    }
    onReply(m);
  }

  return (
    <div
      data-message-id={m.id}
      className={cn(
        "group flex flex-col rounded-xl transition-[box-shadow,background-color] duration-500",
        isAgent ? "items-end" : "items-start",
        highlighted && "bg-[#EEF2FF]/80 ring-2 ring-[#6366F1]/40",
      )}
    >
      <p className="mb-1 px-1 text-xs font-medium text-[#6B7280]">
        {m.authorName}
      </p>
      <div className="relative max-w-[75%]">
        <div
          role={onReply ? "button" : undefined}
          tabIndex={onReply ? 0 : undefined}
          title={onReply ? t("admin.frontDesk.doubleClickReply") : undefined}
          onDoubleClick={(e) => {
            e.preventDefault();
            startReply();
          }}
          onKeyDown={(e) => {
            if (!onReply) return;
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              startReply();
            }
          }}
          className={cn(
            "px-3.5 py-2.5 text-sm leading-relaxed text-[#111827] select-text",
            onReply && "cursor-pointer",
            isAgent
              ? "rounded-2xl rounded-tr-md border border-[#E5E7EB] bg-white"
              : "rounded-2xl rounded-tl-md bg-[#F3F4F6]",
          )}
        >
          {m.replyTo ? (
            <ReplyQuote
              reply={m.replyTo}
              variant={isAgent ? "agent" : "customer"}
            />
          ) : null}
          {images.length > 0 ? <MessageMediaGrid items={images} /> : null}
          {images.length === 0 &&
          (m.messageType === "image" || m.messageType === "sticker") ? (
            <p className="mb-1 text-xs font-medium text-[#0EA5E9]">
              {t("admin.frontDesk.photo")}
            </p>
          ) : null}
          {videos.map((v) => (
            <MessageVideo key={v.url} url={v.url} name={v.name} />
          ))}
          {videos.length === 0 && m.messageType === "video" ? (
            <p className="mb-1 text-xs font-medium text-[#8B5CF6]">
              {t("admin.frontDesk.video")}
            </p>
          ) : null}
          {audios.map((a) => (
            <VoiceNotePlayer key={a.url} url={a.url} peaks={a.peaks} />
          ))}
          {audios.length === 0 &&
          (m.messageType === "audio" || m.messageType === "voice") ? (
            <p className="mb-1 text-xs font-medium text-[#10B981]">
              {t("admin.frontDesk.voice")}
            </p>
          ) : null}
          {docs.map((d) => (
            <DocumentCard
              key={d.url || d.name}
              url={d.url}
              name={d.name}
              size={d.size}
              mime={d.mime}
            />
          ))}
          {showInteractive && m.flow ? (
            <InteractiveOutboundCard flow={m.flow} />
          ) : null}
          {showFlowCard && m.flow ? (
            <FlowMessageCard flow={m.flow} booking={booking} />
          ) : null}
          {unsupported &&
          images.length === 0 &&
          videos.length === 0 &&
          audios.length === 0 &&
          docs.length === 0 &&
          !m.flow ? (
            <p className="text-[#9CA3AF] italic">
              {t("admin.frontDesk.unsupportedType")}
            </p>
          ) : null}
          {body ? (
            <p
              dir={bodyDir}
              lang={bodyDir === "rtl" ? "ar" : undefined}
              className={cn(
                "whitespace-pre-wrap",
                bodyDir === "rtl" ? "text-right" : "text-left",
              )}
            >
              {formatWhatsappText(body)}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-[#6B7280]">
            {onReply ? (
              <button
                type="button"
                onClick={startReply}
                className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium text-[#6B7280] opacity-70 hover:bg-black/5 hover:text-[#111827] hover:opacity-100 group-hover:opacity-100"
                aria-label={t("admin.frontDesk.reply")}
              >
                <Reply className="h-3 w-3" />
                {t("admin.frontDesk.reply")}
              </button>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="tabular-nums">{m.time}</span>
              {isAgent ? (
                <MessageStatusTicks
                  status={m.status ?? (m.read ? "read" : "sent")}
                  timestamps={m.statusTimestamps}
                />
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

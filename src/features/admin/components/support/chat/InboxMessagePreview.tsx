"use client";

import {
  FileText,
  HelpCircle,
  ImageIcon,
  Mic,
  Sticker,
  Video,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import type { SupportConversation } from "../supportDummyData";
import { MessageStatusTicks } from "./MessageStatusTicks";
import { textDirection } from "./textDirection";

const KIND_META: Record<
  string,
  { key: AdminMessageKey; Icon: LucideIcon; className: string }
> = {
  image: {
    key: "admin.frontDesk.photo",
    Icon: ImageIcon,
    className: "text-[#0EA5E9]",
  },
  sticker: {
    key: "admin.frontDesk.sticker",
    Icon: Sticker,
    className: "text-[#A855F7]",
  },
  video: {
    key: "admin.frontDesk.video",
    Icon: Video,
    className: "text-[#8B5CF6]",
  },
  audio: {
    key: "admin.frontDesk.voice",
    Icon: Mic,
    className: "text-[#10B981]",
  },
  voice: {
    key: "admin.frontDesk.voice",
    Icon: Mic,
    className: "text-[#10B981]",
  },
  document: {
    key: "admin.frontDesk.document",
    Icon: FileText,
    className: "text-[#F59E0B]",
  },
  flow: {
    key: "admin.frontDesk.form",
    Icon: Workflow,
    className: "text-[#4F46E5]",
  },
  interactive: {
    key: "admin.frontDesk.form",
    Icon: Workflow,
    className: "text-[#4F46E5]",
  },
  unsupported: {
    key: "admin.frontDesk.unsupported",
    Icon: HelpCircle,
    className: "text-[#9CA3AF]",
  },
  unknown: {
    key: "admin.frontDesk.unsupported",
    Icon: HelpCircle,
    className: "text-[#9CA3AF]",
  },
};

function inferKind(conversation: SupportConversation): string {
  if (conversation.lastMessageType) {
    return conversation.lastMessageType.toLowerCase();
  }
  const preview = conversation.preview.toLowerCase();
  if (preview.includes("unsupported")) return "unsupported";
  if (preview === "photo") return "image";
  if (preview.includes("voice")) return "audio";
  if (preview === "video") return "video";
  if (preview === "document") return "document";
  if (preview.includes("form") || preview.includes("flow")) return "flow";
  return "text";
}

type Props = {
  conversation: SupportConversation;
};

export function InboxMessagePreview({ conversation }: Props) {
  const t = useTranslations();
  const kind = inferKind(conversation);
  const meta = KIND_META[kind];
  const previewDir = textDirection(conversation.preview || "");
  const status = conversation.lastMessageStatus;
  const showTicks =
    status &&
    status !== "received" &&
    (status === "pending" ||
      status === "sent" ||
      status === "delivered" ||
      status === "read" ||
      status === "failed");

  if (!meta || kind === "text") {
    return (
      <div className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-[#6B7280]">
        {showTicks ? (
          <span className="shrink-0">
            <MessageStatusTicks status={status} />
          </span>
        ) : null}
        <p
          dir={previewDir}
          lang={previewDir === "rtl" ? "ar" : undefined}
          className="min-w-0 truncate"
        >
          {conversation.preview}
        </p>
      </div>
    );
  }

  const { Icon, key, className } = meta;
  const label = t(key);
  const caption =
    conversation.preview &&
    conversation.preview !== label &&
    !/^(photo|video|voice message|document|unsupported|form)$/i.test(
      conversation.preview,
    )
      ? conversation.preview
      : null;
  const captionDir = textDirection(caption || label);

  return (
    <div
      className={cn(
        "mt-0.5 flex min-w-0 items-center gap-1 text-sm",
        className,
      )}
    >
      {showTicks ? (
        <span className="shrink-0">
          <MessageStatusTicks status={status} />
        </span>
      ) : null}
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span
        dir={captionDir}
        lang={captionDir === "rtl" ? "ar" : undefined}
        className="min-w-0 truncate font-medium"
      >
        {caption ?? label}
      </span>
    </div>
  );
}

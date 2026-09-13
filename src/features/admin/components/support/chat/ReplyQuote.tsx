"use client";

import { cn } from "@/lib/utils";
import { textDirection } from "./textDirection";

export type ReplyQuoteData = {
  authorName: string;
  body: string;
  messageType?: string;
};

type Props = {
  reply: ReplyQuoteData;
  /** Who sent the message that contains this quote. */
  variant?: "agent" | "customer";
  className?: string;
};

function previewLabel(reply: ReplyQuoteData): string {
  const type = (reply.messageType ?? "").toLowerCase();
  if (type === "image" || type === "sticker") return "Photo";
  if (type === "audio" || type === "voice") return "Voice message";
  if (type === "video") return "Video";
  if (type === "document") return "Document";
  if (type === "location") return "Location";
  if (type === "contacts") return "Contact";
  return reply.body || "Message";
}

export function ReplyQuote({ reply, variant = "customer", className }: Props) {
  const preview = previewLabel(reply);
  const dir = textDirection(preview);
  const isAgent = variant === "agent";

  return (
    <div
      className={cn(
        "mb-1.5 overflow-hidden rounded-md border-l-[3px] px-2.5 py-1.5",
        isAgent
          ? "border-l-[var(--wa-reply-quote-out-border)] bg-[var(--wa-reply-quote-out-bg)]"
          : "border-l-[var(--wa-reply-quote-in-border)] bg-[var(--wa-reply-quote-in-bg)]",
        className,
      )}
    >
      <p
        className={cn(
          "truncate text-xs font-semibold",
          isAgent
            ? "text-[var(--wa-reply-quote-out-text)]"
            : "text-[var(--wa-reply-quote-in-text)]",
        )}
      >
        {reply.authorName}
      </p>
      <p
        dir={dir}
        className={cn(
          "line-clamp-2 text-xs text-[var(--wa-surface-muted-text)]",
          dir === "rtl" ? "text-right" : "text-left",
        )}
      >
        {preview}
      </p>
    </div>
  );
}

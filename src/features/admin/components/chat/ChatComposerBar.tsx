"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ImageIcon, Paperclip, Send } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { CHAT_FOOTER } from "./chatSkin";

type Props = {
  value: string;
  pending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  showAttach?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAddFiles?: (list: FileList | null) => void;
  onOpenLibrary?: () => void;
  topSlot?: ReactNode;
  showreelInputAction?: string;
  showreelAttachAction?: string;
  showreelSendAction?: string;
};

/** Shared bottom composer bar — treatment chat + clinic AI. */
export function ChatComposerBar({
  value,
  pending = false,
  disabled = false,
  placeholder,
  showAttach = false,
  onChange,
  onSend,
  onAddFiles,
  onOpenLibrary,
  topSlot,
  showreelInputAction,
  showreelAttachAction,
  showreelSendAction,
}: Props) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedPlaceholder = placeholder ?? t("admin.chat.typeMessage");

  /** Grows with the text up to ~5 lines, then scrolls instead of pushing the panel taller. */
  const MAX_HEIGHT_PX = 116;
  function autoSize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }
  // Re-measure on every value change, not only on typing — so a send (which
  // clears `value` from the parent) shrinks the box back down too.
  useEffect(autoSize, [value]);

  return (
    <div className={CHAT_FOOTER}>
      {showAttach ? (
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.dcm"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles?.(e.target.files)}
        />
      ) : null}
      {topSlot}
      <div className="flex min-h-12 items-end sm:min-h-13">
        {showAttach ? (
          <button
            type="button"
            aria-label={t("admin.chat.attach")}
            data-showreel-action={showreelAttachAction}
            onClick={() => fileRef.current?.click()}
            className="flex h-12 w-11 shrink-0 items-center justify-center border-e border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] sm:h-13 sm:w-12"
          >
            <Paperclip className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        {onOpenLibrary ? (
          <button
            type="button"
            aria-label={t("admin.chat.mediaLibrary")}
            onClick={onOpenLibrary}
            className="flex h-12 w-11 shrink-0 items-center justify-center border-e border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] sm:h-13 sm:w-12"
          >
            <ImageIcon className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        <textarea
          ref={textareaRef}
          value={value}
          disabled={pending}
          rows={1}
          data-showreel-action={showreelInputAction}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter (or any IME composing) writes a newline —
            // a pasted or dictated SOAP note needs real line breaks.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={resolvedPlaceholder}
          className="my-2 min-w-0 flex-1 resize-none bg-transparent px-3 py-1.5 text-[13px] leading-5 text-[#111111] outline-none placeholder:text-[#70758A] sm:px-4"
        />
        <button
          type="button"
          disabled={disabled}
          data-showreel-action={showreelSendAction}
          onClick={onSend}
          aria-label={t("admin.chat.send")}
          className="flex h-12 w-11 shrink-0 items-center justify-center border-s border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] disabled:opacity-40 sm:h-13 sm:w-12"
        >
          <Send className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
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
}: Props) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const resolvedPlaceholder = placeholder ?? t("admin.chat.typeMessage");

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
      <div className="flex min-h-12 items-stretch sm:min-h-13">
        {showAttach ? (
          <button
            type="button"
            aria-label={t("admin.chat.attach")}
            onClick={() => fileRef.current?.click()}
            className="flex w-11 shrink-0 items-center justify-center border-e border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] sm:w-12"
          >
            <Paperclip className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        {onOpenLibrary ? (
          <button
            type="button"
            aria-label={t("admin.chat.mediaLibrary")}
            onClick={onOpenLibrary}
            className="flex w-11 shrink-0 items-center justify-center border-e border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] sm:w-12"
          >
            <ImageIcon className="size-4" strokeWidth={1.75} />
          </button>
        ) : null}
        <input
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={resolvedPlaceholder}
          className="min-w-0 flex-1 bg-transparent px-3 text-[13px] text-[#111111] outline-none placeholder:text-[#70758A] sm:px-4"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onSend}
          aria-label={t("admin.chat.send")}
          className="flex w-11 shrink-0 items-center justify-center border-s border-[#E8EAED] text-[#70758A] hover:bg-[#F3F4F6] disabled:opacity-40 sm:w-12"
        >
          <Send className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

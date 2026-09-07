"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mic, Plus, Send, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import { AttachmentPopover } from "./AttachmentPopover";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import {
  InteractiveBuilder,
  type InteractiveDraft,
} from "./InteractiveBuilder";
import { SlashCommandMenu, type CannedReply } from "./SlashCommandMenu";
import { VoiceRecorderBar } from "./VoiceRecorderBar";
import { ReplyComposerBar } from "./ReplyComposerBar";
import type { ComposerSendPayload } from "./composerTypes";
import {
  composeRowVariants,
  composerSwapTransition,
  recordRowVariants,
} from "./composerRecordMotion";
import { textDirection } from "./textDirection";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (payload: ComposerSendPayload) => void;
  disabled?: boolean;
  replyTo?: SupportMessage | null;
  onClearReply?: () => void;
};

function insertAtCaret(
  value: string,
  start: number,
  end: number,
  insert: string,
) {
  const next = value.slice(0, start) + insert + value.slice(end);
  return { next, caret: start + insert.length };
}

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  disabled,
  replyTo,
  onClearReply,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const swap = composerSwapTransition(reduced);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interactive, setInteractive] = useState<InteractiveDraft | null>(
    null,
  );
  const [slashIndex, setSlashIndex] = useState(0);
  const contentDir = textDirection(draft);
  const dir = draft.trim()
    ? contentDir
    : locale === "ar"
      ? "rtl"
      : "ltr";

  const slash = useMemo(() => {
    const m = /(^|\s)\/([a-z0-9_-]*)$/i.exec(draft);
    if (!m) return null;
    return { query: m[2] ?? "", start: m.index + (m[1]?.length ?? 0) };
  }, [draft]);

  const canSend =
    Boolean(draft.trim()) ||
    interactive?.mode === "buttons" ||
    interactive?.mode === "cta";

  function insertEmoji(emoji: string) {
    const el = taRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const { next, caret } = insertAtCaret(draft, start, end, emoji);
    onDraftChange(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function injectCanned(reply: CannedReply) {
    if (!slash) return;
    const before = draft.slice(0, slash.start);
    const after = draft.slice(slash.start + 1 + slash.query.length);
    onDraftChange(`${before}${reply.body}${after}`);
  }

  function withReply(payload: ComposerSendPayload): ComposerSendPayload {
    if (!replyTo?.kapsoWamid) return payload;
    return {
      ...payload,
      replyTo: {
        wamid: replyTo.kapsoWamid,
        authorName: replyTo.authorName,
        body: replyTo.body.slice(0, 160),
        messageType: replyTo.messageType,
      },
    };
  }

  function submitText() {
    const text = draft.trim();
    if (interactive?.mode === "buttons") {
      const labels = interactive.labels.map((l) => l.trim()).filter(Boolean);
      if (!labels.length) return;
      onSend(
        withReply({
          kind: "interactive_buttons",
          text: text || t("admin.frontDesk.pleaseChoose"),
          buttons: labels.map((title, i) => ({
            id: `btn_${i + 1}`,
            title,
          })),
          flow: {
            kind: "buttons",
            title: "Quick replies",
            subtitle: text,
            buttons: labels.map((title, i) => ({
              id: `btn_${i + 1}`,
              title,
            })),
          },
        }),
      );
      setInteractive(null);
      onDraftChange("");
      onClearReply?.();
      return;
    }
    if (interactive?.mode === "cta") {
      if (!interactive.label.trim() || !interactive.url.startsWith("http")) {
        return;
      }
      onSend(
        withReply({
          kind: "interactive_cta",
          text: text || t("admin.frontDesk.tapDetails"),
          ctaLabel: interactive.label.trim(),
          ctaUrl: interactive.url.trim(),
          flow: {
            kind: "cta",
            title: interactive.label,
            subtitle: text,
            ctaLabel: interactive.label,
            ctaUrl: interactive.url,
            cta: interactive.label,
          },
        }),
      );
      setInteractive(null);
      onDraftChange("");
      onClearReply?.();
      return;
    }
    if (!text) return;
    onSend(withReply({ kind: "text", text }));
    onDraftChange("");
    onClearReply?.();
  }

  function autoSize() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function sendRecording(file: File) {
    const url = URL.createObjectURL(file);
    onSend({
      kind: "audio",
      file,
      localMedia: [
        { url, mime: file.type, name: file.name, size: file.size },
      ],
      ...(replyTo?.kapsoWamid
        ? {
            replyTo: {
              wamid: replyTo.kapsoWamid,
              authorName: replyTo.authorName,
              body: replyTo.body.slice(0, 160),
              messageType: replyTo.messageType,
            },
          }
        : {}),
    });
    setRecording(false);
    onClearReply?.();
  }

  return (
    <div className="shrink-0 overflow-hidden border-t border-[#E5E7EB] bg-[#F7F8FA] px-3 py-2.5">
      <AnimatePresence mode="wait" initial={false}>
        {recording ? (
          <motion.div
            key="recorder"
            variants={recordRowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={swap}
          >
            <VoiceRecorderBar
              onCancel={() => setRecording(false)}
              onSend={sendRecording}
            />
          </motion.div>
        ) : (
          <motion.div
            key="compose"
            variants={composeRowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={swap}
          >
            {replyTo ? (
              <ReplyComposerBar
                reply={{
                  authorName: replyTo.authorName,
                  body: replyTo.body,
                  messageType: replyTo.messageType,
                }}
                onCancel={() => onClearReply?.()}
              />
            ) : null}
            <InteractiveBuilder value={interactive} onChange={setInteractive} />
            <div className="relative flex flex-col gap-1.5">
              <SlashCommandMenu
                open={Boolean(slash)}
                query={slash?.query ?? ""}
                selectedIndex={slashIndex}
                onSelectedIndexChange={setSlashIndex}
                onSelect={injectCanned}
              />
              <div className="flex items-end gap-2">
                <div className="relative mb-0.5 shrink-0">
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full text-[#54656F] hover:bg-[#E9EDEF]"
                    aria-label={t("admin.frontDesk.attach")}
                    aria-expanded={attachOpen}
                    onClick={() => {
                      setEmojiOpen(false);
                      setAttachOpen((v) => !v);
                    }}
                  >
                    <Plus className="size-6" strokeWidth={1.75} />
                  </button>
                  {attachOpen ? (
                    <AttachmentPopover
                      onClose={() => setAttachOpen(false)}
                      onSend={(payload) => {
                        onSend(withReply(payload));
                        setAttachOpen(false);
                        onClearReply?.();
                      }}
                    />
                  ) : null}
                </div>
                <div
                  className="relative flex min-w-0 flex-1 items-end gap-1 rounded-[24px] bg-[#E9EDEF] ps-3 pe-1.5 py-1.5"
                  dir={dir}
                >
                  <textarea
                    ref={taRef}
                    value={draft}
                    disabled={disabled}
                    dir={dir}
                    lang={dir === "rtl" ? "ar" : "en"}
                    onChange={(e) => {
                      onDraftChange(e.target.value);
                      requestAnimationFrame(autoSize);
                    }}
                    onKeyDown={(e) => {
                      if (slash && e.key === "ArrowDown") {
                        e.preventDefault();
                        setSlashIndex((i) => i + 1);
                        return;
                      }
                      if (slash && e.key === "ArrowUp") {
                        e.preventDefault();
                        setSlashIndex((i) => Math.max(0, i - 1));
                        return;
                      }
                      if (slash && e.key === "Escape") {
                        e.preventDefault();
                        onDraftChange(
                          draft.replace(/(^|\s)\/[a-z0-9_-]*$/i, "$1"),
                        );
                        return;
                      }
                      if (slash && e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const btn = document.querySelector(
                          '[role="listbox"] [aria-selected="true"]',
                        ) as HTMLButtonElement | null;
                        btn?.click();
                        return;
                      }
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitText();
                      }
                    }}
                    rows={1}
                    className={cn(
                      "max-h-[140px] min-h-[28px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-[#111B21] outline-none placeholder:text-[#8696A0]",
                      dir === "rtl"
                        ? "text-right placeholder:text-right"
                        : "text-left placeholder:text-left",
                    )}
                    placeholder={t("admin.frontDesk.writeMessage")}
                    aria-label={t("admin.frontDesk.message")}
                  />
                  <div className="relative mb-0.5 shrink-0">
                    <button
                      type="button"
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-[#54656F] hover:bg-[#D1D7DB]",
                        emojiOpen && "bg-[#D1D7DB] text-[#111B21]",
                      )}
                      aria-label={t("admin.frontDesk.emoji")}
                      aria-expanded={emojiOpen}
                      onClick={() => {
                        setAttachOpen(false);
                        setEmojiOpen((v) => !v);
                      }}
                    >
                      <Smile className="size-5" strokeWidth={1.75} />
                    </button>
                    {emojiOpen ? (
                      <EmojiPickerPopover onPick={insertEmoji} />
                    ) : null}
                  </div>
                </div>
                {canSend ? (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={submitText}
                    className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary)] text-white shadow-sm hover:opacity-90 disabled:opacity-40"
                    aria-label={t("admin.frontDesk.send")}
                  >
                    <Send
                      className="size-4 translate-x-px -translate-y-px"
                      strokeWidth={2}
                    />
                  </button>
                ) : (
                  <motion.button
                    type="button"
                    disabled={disabled}
                    whileTap={reduced || disabled ? undefined : { scale: 0.88 }}
                    className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-[#54656F] hover:bg-[#E9EDEF] disabled:opacity-40"
                    aria-label={t("admin.frontDesk.recordVoice")}
                    onClick={() => {
                      setAttachOpen(false);
                      setEmojiOpen(false);
                      setRecording(true);
                    }}
                  >
                    <Mic className="size-5" strokeWidth={1.75} />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

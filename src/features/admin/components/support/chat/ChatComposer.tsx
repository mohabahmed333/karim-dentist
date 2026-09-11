"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mic, Plus, Send, Smile } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  QUICK_REPLY_BUCKET,
  type CannedReplyAttachment,
} from "@/services/whatsapp/cannedReplyInput";
import {
  findUnfilledFields,
  renderQuickReply,
} from "@/services/whatsapp/quickReplyFields";
import { clinicLocationPin } from "./clinicLocationPin";
import { QuickReplyComposerBar } from "./QuickReplyComposerBar";
import { planQuickReplySend } from "./quickReplySend";
import { useQuickReplyValues } from "./useQuickReplyValues";
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
import {
  SessionExpiredTemplatePanel,
  type TemplateSendPayload,
} from "./SessionExpiredTemplatePanel";
import type { ComposerSendPayload } from "./composerTypes";
import {
  composeRowVariants,
  composerSwapTransition,
  recordRowVariants,
} from "./composerRecordMotion";
import { lastStrongLocale } from "./textDirection";
import { useDismissOnOutsidePointer } from "./useDismissOnOutsidePointer";
import type { SupportMessage } from "../supportDummyData";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import {
  SHOWREEL_WHATSAPP_EVENT,
  type ShowreelWhatsappDetail,
} from "@/features/portfolio/showreel/product-scenes/showreelAdminEvents";

type Props = {
  draft: string;
  onDraftChange: (value: string) => void;
  /** May return a promise; multi-message quick replies wait for each send in turn. */
  onSend: (payload: ComposerSendPayload) => void | Promise<void>;
  disabled?: boolean;
  replyTo?: SupportMessage | null;
  onClearReply?: () => void;
  conversationId?: string;
  onSendTemplate?: (payload: TemplateSendPayload) => Promise<boolean>;
  /** The quick reply attachment that goes out with this chat's draft. */
  quickAttachment?: CannedReplyAttachment | null;
  onQuickAttachmentChange?: (attachment: CannedReplyAttachment | null) => void;
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
  conversationId,
  onSendTemplate,
  quickAttachment = null,
  onQuickAttachmentChange,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const swap = composerSwapTransition(reduced);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [interactive, setInteractive] = useState<InteractiveDraft | null>(
    null,
  );
  const [slashIndex, setSlashIndex] = useState(0);
  // The ref flips synchronously, so a second click or Enter during the file
  // download is ignored; the state disables the Send button.
  const quickSendingRef = useRef(false);
  const [quickSending, setQuickSending] = useState(false);
  const loadQuickReplyValues = useQuickReplyValues(conversationId);
  const unfilled = useMemo(() => findUnfilledFields(draft), [draft]);
  // A known {{field}} anywhere in the draft — from a reply or typed by hand —
  // means the message is unfinished. It must not reach a patient.
  const blocked = unfilled.length > 0;
  const showreelDemo =
    typeof document !== "undefined" &&
    document.documentElement.dataset.showreelDemo === "1";

  useEffect(() => {
    function onShowreel(event: Event) {
      const detail = (event as CustomEvent<ShowreelWhatsappDetail>).detail;
      if (!detail) return;
      if (detail.type === "quick-replies") {
        setInteractive({
          mode: "buttons",
          labels: ["Tue 10:30", "Wed 14:00", "Call me back"],
        });
        return;
      }
      if (detail.type === "compose-message") {
        onDraftChange(detail.text);
        return;
      }
      if (detail.type === "voice-start") {
        onDraftChange("");
        setInteractive(null);
        setAttachOpen(false);
        setEmojiOpen(false);
        setRecording(true);
        return;
      }
      if (detail.type === "send-message") {
        const text = detail.text.trim();
        if (!text) return;
        onSend({ kind: "text", text });
        onDraftChange("");
        setInteractive(null);
        onClearReply?.();
      }
    }
    window.addEventListener(SHOWREEL_WHATSAPP_EVENT, onShowreel);
    return () =>
      window.removeEventListener(SHOWREEL_WHATSAPP_EVENT, onShowreel);
  }, [onClearReply, onDraftChange, onSend]);

  /** Sticky keyboard language — chrome stays on app locale, text follows this. */
  const [inputLocale, setInputLocale] = useState<Locale>(() =>
    locale === "ar" ? "ar" : "en",
  );
  const textDir = inputLocale === "ar" ? "rtl" : "ltr";

  const slash = useMemo(() => {
    const m = /(^|\s)\/([\p{L}\p{N}_-]*)$/u.exec(draft);
    if (!m) return null;
    return { query: m[2] ?? "", start: m.index + (m[1]?.length ?? 0) };
  }, [draft]);

  function updateDraft(value: string) {
    const detected = lastStrongLocale(value);
    if (detected) setInputLocale(detected);
    onDraftChange(value);
    // Clearing the message box also drops the quick reply's attachment.
    if (!value.trim() && quickAttachment) onQuickAttachmentChange?.(null);
  }

  function clearSlashCommand() {
    updateDraft(draft.replace(/(^|\s)\/[\p{L}\p{N}_-]*$/u, "$1"));
  }

  useDismissOnOutsidePointer(attachOpen, attachRef, () => setAttachOpen(false));
  useDismissOnOutsidePointer(emojiOpen, emojiRef, () => setEmojiOpen(false));
  useDismissOnOutsidePointer(Boolean(slash), slashRef, clearSlashCommand, [
    taRef,
  ]);
  useDismissOnOutsidePointer(templateOpen, templateRef, () =>
    setTemplateOpen(false),
  );

  const canSend =
    Boolean(draft.trim()) ||
    Boolean(quickAttachment) ||
    interactive?.mode === "buttons" ||
    interactive?.mode === "cta";

  function insertEmoji(emoji: string) {
    const el = taRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const { next, caret } = insertAtCaret(draft, start, end, emoji);
    updateDraft(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  async function injectCanned(reply: CannedReply) {
    if (!slash) return;
    const before = draft.slice(0, slash.start);
    const after = draft.slice(slash.start + 1 + slash.query.length);
    void fetch(`/api/v1/whatsapp/canned-replies/${reply.id}/use`, {
      method: "POST",
    }).catch(() => undefined);
    // Fill in the language of the body actually inserted, not the keyboard's.
    const values = await loadQuickReplyValues(reply.locale);
    updateDraft(`${before}${renderQuickReply(reply.body, values).text}${after}`);
    onQuickAttachmentChange?.(reply.attachment ?? null);
  }

  async function sendWithAttachment(
    text: string,
    attachment: CannedReplyAttachment,
  ) {
    if (quickSendingRef.current) return;
    quickSendingRef.current = true;
    setQuickSending(true);
    try {
      let file: File | null = null;
      if (attachment.kind !== "location") {
        const { data, error } = await createClient()
          .storage.from(QUICK_REPLY_BUCKET)
          .download(attachment.path);
        if (error || !data) {
          // Keep the draft and the chip: staff can retry or remove the attachment.
          toast.error(t("admin.frontDesk.quickReplyAttachmentFail"));
          return;
        }
        file = new File([data], attachment.name, { type: attachment.mime });
      }

      const steps = planQuickReplySend(text, attachment);
      onDraftChange("");
      onQuickAttachmentChange?.(null);
      // Every step reuses the onSend captured at click time. Don't refactor this
      // to read a "latest onSend" ref: the parent's `sending` guard would drop
      // the later steps.
      for (const [index, step] of steps.entries()) {
        // Only the first message quotes the reply-to, as a single send would.
        const prepare = (payload: ComposerSendPayload) =>
          index === 0 ? withReply(payload) : payload;
        if (step.kind === "text") {
          await onSend(prepare({ kind: "text", text: step.text }));
        } else if (step.kind === "location") {
          const pin = clinicLocationPin();
          await onSend(
            prepare({
              kind: "location",
              text: pin.address,
              location: pin,
              flow: {
                kind: "location",
                title: pin.name,
                address: pin.address,
                latitude: pin.latitude,
                longitude: pin.longitude,
              },
            }),
          );
        } else if (step.kind === "file" && file) {
          const url = URL.createObjectURL(file);
          await onSend(
            prepare({
              kind: attachment.kind === "image" ? "image" : "document",
              file,
              text: step.caption || undefined,
              localMedia: [{ url, mime: file.type, name: file.name, size: file.size }],
            }),
          );
        }
      }
      onClearReply?.();
    } finally {
      quickSendingRef.current = false;
      setQuickSending(false);
    }
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

  async function submitText() {
    if (blocked) return;
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
    if (quickAttachment) {
      await sendWithAttachment(text, quickAttachment);
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
    <div className="relative z-20 shrink-0 overflow-visible border-t border-[#E5E7EB] bg-[#F7F8FA]">
      {templateOpen && conversationId && onSendTemplate ? (
        <div ref={templateRef}>
          <SessionExpiredTemplatePanel
            conversationId={conversationId}
            sending={disabled}
            mode="optional"
            onDismiss={() => setTemplateOpen(false)}
            onSendTemplate={onSendTemplate}
          />
        </div>
      ) : null}
      <div className="px-3 py-2.5">
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
              demo={showreelDemo}
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
            <QuickReplyComposerBar
              unfilled={unfilled}
              attachment={quickAttachment}
              onRemoveAttachment={() => onQuickAttachmentChange?.(null)}
            />
            <div className="relative flex flex-col gap-1.5">
              <div ref={slashRef}>
                <SlashCommandMenu
                  open={Boolean(slash)}
                  query={slash?.query ?? ""}
                  contentLocale={inputLocale}
                  selectedIndex={slashIndex}
                  onSelectedIndexChange={setSlashIndex}
                  onSelect={(reply) => void injectCanned(reply)}
                />
              </div>
              <div className="flex items-end gap-2">
                <div ref={attachRef} className="relative z-30 mb-0.5 shrink-0">
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
                      onOpenTemplate={
                        onSendTemplate && conversationId
                          ? () => setTemplateOpen(true)
                          : undefined
                      }
                      onSend={(payload) => {
                        onSend(withReply(payload));
                        setAttachOpen(false);
                        onClearReply?.();
                      }}
                    />
                  ) : null}
                </div>
                <div className="relative flex min-w-0 flex-1 items-end gap-1 rounded-[24px] bg-[#E9EDEF] ps-3 pe-1.5 py-1.5">
                  <textarea
                    ref={taRef}
                    value={draft}
                    disabled={disabled}
                    data-showreel-action="whatsapp-composer"
                    dir={textDir}
                    lang={inputLocale}
                    onChange={(e) => {
                      updateDraft(e.target.value);
                      requestAnimationFrame(autoSize);
                    }}
                    onKeyDown={(e) => {
                      const fromKey = lastStrongLocale(e.key);
                      if (fromKey) setInputLocale(fromKey);
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
                        clearSlashCommand();
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
                        void submitText();
                      }
                    }}
                    rows={1}
                    className={cn(
                      "max-h-[140px] min-h-[28px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-5 text-[#111B21] outline-none placeholder:text-[#8696A0]",
                      textDir === "rtl"
                        ? "text-right placeholder:text-right"
                        : "text-left placeholder:text-left",
                    )}
                    placeholder={t("admin.frontDesk.writeMessage")}
                    aria-label={t("admin.frontDesk.message")}
                  />
                  <div ref={emojiRef} className="relative z-10 mb-0.5 shrink-0">
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
                    disabled={disabled || blocked || quickSending}
                    data-showreel-action="whatsapp-send"
                    onClick={() => void submitText()}
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
                    data-showreel-action="whatsapp-voice"
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
    </div>
  );
}

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { ChatComposerBar } from "./ChatComposerBar";
import { ChatMessageAttachmentStack } from "./ChatMessageAttachment";
import { ChatPanelHeader, type ChatPanelTab } from "./ChatPanelHeader";
import { ChatShell } from "./ChatShell";
import { ChatSlashMenu } from "./ChatSlashMenu";
import { ChatThreadSkeleton } from "./ChatThreadSkeleton";
import { CHAT_BUBBLE, CHAT_META } from "./chatSkin";
import {
  createPendingUploads,
  revokePendingUploads,
  type PendingChatUpload,
} from "./pendingUpload";
import {
  matchSlashCommands,
  slashPrompt,
  type ChatSlashCommand,
} from "./slashCommands";
import {
  clearClinicChatHistory,
  loadClinicChatHistory,
  saveClinicChatHistory,
} from "./clinicChatHistory";
import type { AdminAiChatMessage } from "./chatTypes";

export type { AdminAiChatMessage };

type Props = {
  title: string;
  subtitle: string;
  placeholder?: string;
  welcome?: AdminAiChatMessage;
  slashCommands?: ChatSlashCommand[];
  className?: string;
  /** Persist transcript under this key (localStorage). */
  historyKey?: string;
  /** Domain extras under the last assistant message (polls, drafts, etc.) */
  extras?: ReactNode;
  /** Called with the full transcript after the user turn is appended. */
  onAsk: (messages: AdminAiChatMessage[]) => Promise<string>;
};

export function AdminAiChat({
  title,
  subtitle,
  placeholder,
  welcome,
  slashCommands = [],
  className,
  historyKey,
  extras,
  onAsk,
}: Props) {
  const t = useTranslations();
  const homeTabs: { id: ChatPanelTab; label: string }[] = [
    { id: "chat", label: t("admin.patients.chat") },
    { id: "attachments", label: t("admin.patients.attachments") },
  ];
  const resolvedPlaceholder = placeholder ?? t("admin.chat.messageOrSlash");
  const [tab, setTab] = useState<ChatPanelTab>("chat");
  const [ready, setReady] = useState(!historyKey);
  const [messages, setMessages] = useState<AdminAiChatMessage[]>(() =>
    welcome ? [welcome] : [],
  );
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [uploads, setUploads] = useState<PendingChatUpload[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const slashMatches = useMemo(
    () => matchSlashCommands(input, slashCommands),
    [input, slashCommands],
  );

  useEffect(() => {
    if (!historyKey) {
      setReady(true);
      return;
    }
    const stored = loadClinicChatHistory(historyKey);
    if (stored && stored.length > 0) setMessages(stored);
    else if (welcome) setMessages([welcome]);
    setReady(true);
    // welcome is initial fallback only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyKey]);

  useEffect(() => {
    if (!historyKey || !ready) return;
    saveClinicChatHistory(historyKey, messages);
  }, [historyKey, messages, ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => () => revokePendingUploads(uploads), [uploads]);

  const attachmentUrls = useMemo(() => {
    const urls: string[] = [];
    for (const msg of messages) {
      for (const url of msg.imageUrls ?? []) urls.push(url);
    }
    return urls;
  }, [messages]);

  async function ask(text: string, imageUrls: string[] = []) {
    const content =
      text ||
      (imageUrls.length > 0
        ? t("admin.chat.attachedFiles").replace("{count}", String(imageUrls.length))
        : "");
    if (!content) return;
    const userTurn: AdminAiChatMessage = {
      role: "user",
      content,
      at: stamp(),
      imageUrls: imageUrls.length ? imageUrls : undefined,
    };
    const next = [...messages, userTurn];
    setMessages(next);
    setPending(true);
    try {
      const reply = await onAsk(next);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, at: stamp() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error ? err.message : t("admin.chat.reachAssist"),
          at: stamp(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function send() {
    if (pending) return;
    if (slashMatches.length === 1) {
      const cmd = slashMatches[0]!;
      setInput("");
      void ask(slashPrompt(cmd, t));
      return;
    }
    if (slashMatches.length > 0) return;
    const text = input.trim();
    const urls = uploads.map((u) => u.previewUrl);
    if (!text && urls.length === 0) return;
    setInput("");
    setUploads([]);
    void ask(text, urls);
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const allowed = [...list].filter(
      (f) =>
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.name.toLowerCase().endsWith(".dcm"),
    );
    if (allowed.length === 0) {
      toast.error(t("admin.chat.attachTypes"));
      return;
    }
    setUploads((prev) =>
      [...prev, ...createPendingUploads(allowed)].slice(0, 8),
    );
  }

  function clear() {
    revokePendingUploads(uploads);
    setUploads([]);
    setMessages(welcome ? [welcome] : []);
    setInput("");
    setTab("chat");
    if (historyKey) clearClinicChatHistory(historyKey);
    toast.success(t("admin.chat.cleared"));
  }

  if (!ready) {
    return (
      <ChatShell className={className}>
        <ChatPanelHeader
          title={title}
          subtitle={subtitle}
          tab={tab}
          tabs={homeTabs}
          onTabChange={setTab}
          canClear={false}
          onClear={() => undefined}
        />
        <ChatThreadSkeleton />
        <ChatComposerBar
          value=""
          pending
          disabled
          placeholder={resolvedPlaceholder}
          showAttach
          onChange={() => undefined}
          onSend={() => undefined}
        />
      </ChatShell>
    );
  }

  return (
    <ChatShell className={className}>
      <ChatPanelHeader
        title={title}
        subtitle={subtitle}
        tab={tab}
        tabs={homeTabs}
        onTabChange={setTab}
        canClear={messages.length > (welcome ? 1 : 0) || uploads.length > 0}
        onClear={clear}
      />

      {tab === "attachments" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {attachmentUrls.length === 0 && uploads.length === 0 ? (
            <p className={`pt-12 text-center text-[12px] ${CHAT_META}`}>
              {t("admin.chat.noAttachments")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <ChatMessageAttachmentStack urls={attachmentUrls} />
              {uploads.map((item) => (
                <ChatMessageAttachmentStack
                  key={item.id}
                  urls={[item.previewUrl]}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <p className={`pt-16 text-center text-[12px] ${CHAT_META}`}>
                {t("admin.chat.askOrSlash")}
              </p>
            ) : null}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const lastAssistant =
                !isUser &&
                i ===
                  (() => {
                    for (let j = messages.length - 1; j >= 0; j -= 1) {
                      if (messages[j]?.role === "assistant") return j;
                    }
                    return -1;
                  })();
              return (
                <div
                  key={`${msg.role}-${i}`}
                  className={isUser ? "ms-8" : "me-4"}
                >
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className={`text-[11px] font-semibold ${CHAT_META}`}>
                      {isUser ? t("admin.chat.you") : t("admin.chat.aiAssist")}
                    </span>
                    {msg.at ? (
                      <span className={`text-[10px] ${CHAT_META}`}>{msg.at}</span>
                    ) : null}
                  </div>
                  <div
                    className={
                      isUser
                        ? "ms-auto w-fit max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 text-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                        : CHAT_BUBBLE
                    }
                    style={
                      isUser
                        ? { background: "var(--admin-primary)" }
                        : undefined
                    }
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.imageUrls?.length ? (
                      <ChatMessageAttachmentStack urls={msg.imageUrls} />
                    ) : null}
                    {lastAssistant ? extras : null}
                  </div>
                </div>
              );
            })}
            {pending ? (
              <p className={`text-[12px] ${CHAT_META}`}>{t("admin.chat.thinking")}</p>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div
            onPaste={(e: ClipboardEvent<HTMLDivElement>) => {
              const items = e.clipboardData?.files;
              if (items && items.length > 0) {
                e.preventDefault();
                addFiles(items);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e: DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
          >
            <ChatComposerBar
              value={input}
              pending={pending}
              disabled={pending || (!input.trim() && uploads.length === 0)}
              placeholder={resolvedPlaceholder}
              showAttach
              onChange={setInput}
              onSend={send}
              onAddFiles={addFiles}
              topSlot={
                <>
                  {uploads.length > 0 ? (
                    <div className="flex flex-wrap gap-2 border-b border-[#E8EAED] px-3 py-2">
                      {uploads.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setUploads((prev) => {
                              const target = prev.find((u) => u.id === item.id);
                              if (target)
                                URL.revokeObjectURL(target.previewUrl);
                              return prev.filter((u) => u.id !== item.id);
                            })
                          }
                          className="relative size-14 overflow-hidden rounded-lg border border-[#E8EAED]"
                          title={t("admin.chat.remove")}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <ChatSlashMenu
                    commands={slashMatches}
                    onPick={(cmd) => {
                      setInput("");
                      void ask(slashPrompt(cmd, t));
                    }}
                  />
                </>
              }
            />
          </div>
        </>
      )}
    </ChatShell>
  );
}

function stamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

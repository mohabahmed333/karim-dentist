"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/lib/i18n";
import { modelTranscript } from "./clinicAssistTranscript";
import { readClinicAssistStream } from "./clinicAssistStream";
import {
  appendMessage,
  clearThread,
  createSessionThread,
  findResumableThread,
  listMessages,
  listThreadSummaries,
  renameThread,
  seedWelcome,
  updateThreadContext,
  WELCOME_CONTENT,
  type ClinicChatAction,
  type ClinicChatActivePatient,
  type ClinicChatMessageMeta,
  type ClinicChatThreadContext,
  type ClinicChatThreadSummary,
} from "@/services/clinic_chat";
import { ChatComposerBar } from "../ChatComposerBar";
import { ChatPanelHeader } from "../ChatPanelHeader";
import { ChatShell } from "../ChatShell";
import { ChatSlashMenu } from "../ChatSlashMenu";
import { CHAT_BUBBLE, CHAT_META } from "../chatSkin";
import {
  matchSlashCommands,
  slashPrompt,
  getClinicSlashCommands,
  type ChatSlashCommand,
} from "../slashCommands";
import type { AdminAiChatMessage } from "../chatTypes";
import { ActionChips } from "./ActionChips";
import { isComposerStartSet } from "./chipRail";
import { BookBookingPanel } from "./BookBookingPanel";
import { ChatHistoryList } from "./ChatHistoryList";
import { QuickActionBar } from "./QuickActionBar";
import {
  getStartActions,
  patientScopedActions,
  type ActivePatient,
} from "./flowTypes";
import { useReceptionFlows } from "./useReceptionFlows";
import {
  ActionReviewCard,
  type ProposalReviewState,
} from "../ActionReviewCard";
import { proposeFromChat } from "../proposeFromChat";
import type { ProposedAction } from "@/services/admin_ai";
import {
  createPendingUploads,
  revokePendingUploads,
  type PendingChatUpload,
} from "../pendingUpload";
import { MediaLibraryDialog } from "../../MediaLibraryDialog";
import { uploadPublicMedia } from "@/lib/supabase/upload";
import { prepareMediaFile } from "@/lib/supabase/uploadHelpers";
import { ChatUiSkeleton } from "../ChatUiSkeleton";
import {
  bannerVariants,
  chatTransition,
  messageVariants,
  panelVariants,
  workingVariants,
} from "../chatMotion";
import { listReservations } from "@/services/reservations";
import { findOpenReservationForPatient } from "./receptionHelpers";
import { useChatScroll } from "../../support/chat/useChatScroll";

type Props = {
  className?: string;
  onClose?: () => void;
  /** Prefill Clinic Assist with this contact (e.g. from Front desk Ask AI). */
  initialPatient?: ActivePatient | null;
  chatLayout?: import("@/features/admin/hooks/useAdminChatLayout").AdminChatLayout;
  onToggleChatLayout?: () => void;
  onCollapseDock?: () => void;
};

type View = "chat" | "history";

/** The clinic-chat route's final `done` event — same shape it used to return as one JSON body. */
type ClinicChatDonePayload = {
  reply?: string;
  suggestedActions?: ClinicChatAction[];
  proposedActions?: ProposedAction[];
  dropped?: number;
};

function slashToStartId(cmd: ChatSlashCommand): string | null {
  const map: Record<string, string> = {
    book: "start:book",
    today: "start:today",
    pending: "start:pending",
    noshow: "start:noshow",
    patient: "start:patient",
    note: "start:note",
    attention: "start:pending",
    website: "start:website",
    chart: "start:chart",
    clinical: "start:clinical",
  };
  return map[cmd.id] ?? null;
}

function metaActions(meta: unknown): ClinicChatAction[] | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const actions = (meta as ClinicChatMessageMeta).actions;
  return Array.isArray(actions) ? actions : undefined;
}

function parseActivePatient(raw: unknown): ActivePatient | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as ClinicChatActivePatient;
  if (!p.patientKey || !p.name) return null;
  return {
    patientKey: p.patientKey,
    name: p.name,
    phone: p.phone ?? "",
    href: p.href,
    lastReservationId: p.lastReservationId,
    noteCount: p.noteCount,
  };
}

function rowsToUi(
  rows: { role: string; content: string; created_at: string; meta: unknown }[],
): AdminAiChatMessage[] {
  return rows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      at: new Date(m.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      meta: (() => {
        const actions = metaActions(m.meta);
        return actions ? { actions } : undefined;
      })(),
    }));
}

/** Survives React Strict Mode remount; resets on full page refresh. */
let bootThreadId: string | null = null;

export function ReceptionChat({
  className,
  onClose,
  initialPatient = null,
  chatLayout,
  onToggleChatLayout,
  onCollapseDock,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminAiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [tab, setTab] = useState<View>("chat");
  const [activePatient, setActivePatient] = useState<ActivePatient | null>(
    null,
  );
  const [history, setHistory] = useState<ClinicChatThreadSummary[]>([]);
  const [titled, setTitled] = useState(false);
  const [proposalReview, setProposalReview] =
    useState<ProposalReviewState | null>(null);
  const [uploads, setUploads] = useState<PendingChatUpload[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryUrls, setLibraryUrls] = useState<string[]>([]);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const clinicSlash = getClinicSlashCommands(t);
  const slashMatches = matchSlashCommands(input, clinicSlash);

  function welcomeSeed() {
    return {
      content: t("admin.chat.welcome"),
      actions: getStartActions(t),
      title: t("admin.chat.defaultTitle"),
    };
  }

  const refreshHistory = useCallback(async () => {
    try {
      setHistory(await listThreadSummaries());
    } catch {
      /* ignore */
    }
  }, []);

  const persistPatient = useCallback(
    async (patient: ActivePatient | null) => {
      setActivePatient(patient);
      if (!threadId) return;
      const context: ClinicChatThreadContext = patient
        ? { activePatient: patient }
        : {};
      try {
        await updateThreadContext(threadId, context);
      } catch {
        /* non-fatal */
      }
    },
    [threadId],
  );

  const persist = useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      actions?: ClinicChatAction[],
    ) => {
      if (!threadId) {
        setMessages((prev) => [
          ...prev,
          {
            role,
            content,
            meta: actions ? { actions } : undefined,
          },
        ]);
        return;
      }
      if (role === "user" && !titled) {
        setTitled(true);
        void renameThread(threadId, content.slice(0, 60) || t("admin.chat.defaultTitle"));
      }
      const row = await appendMessage({
        threadId,
        role,
        content,
        meta: actions ? { actions } : undefined,
      });
      const at = new Date(row.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setMessages((prev) => [
        ...prev,
        {
          role,
          content,
          at,
          meta: actions ? { actions } : undefined,
        },
      ]);
      void refreshHistory();
    },
    [refreshHistory, threadId, titled],
  );

  const {
    busy,
    handleAction,
    consumeNewPatientLine,
    consumeNoteLine,
    clearActivePatient,
    bookPanel,
    setBookName,
    setBookPhone,
    selectBookService,
    continueBookFromPanel,
    cancelBookPanel,
  } = useReceptionFlows(persist, {
    initialPatient: activePatient,
    onActivePatientChange: (patient) => {
      void persistPatient(patient);
    },
  });

  const startFreshSession = useCallback(async () => {
    clearActivePatient();
    setActivePatient(null);
    setTitled(false);
    setInput("");
    const thread = await createSessionThread(
      `Clinic · ${new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    );
    bootThreadId = thread.id;
    const welcome = await seedWelcome(thread.id, welcomeSeed());
    setThreadId(thread.id);
    setMessages(rowsToUi([welcome]));
    await refreshHistory();
    setTab("chat");
  }, [clearActivePatient, refreshHistory, t]);

  const openHistoryThread = useCallback(
    async (id: string) => {
      try {
        const rows = await listMessages(id);
        const summaries = await listThreadSummaries();
        const thread = summaries.find((t) => t.id === id);
        setThreadId(id);
        setMessages(rowsToUi(rows));
        setTitled(true);
        clearActivePatient();
        const ctx = (thread?.context ?? {}) as ClinicChatThreadContext;
        setActivePatient(parseActivePatient(ctx.activePatient));
        setHistory(summaries);
        setTab("chat");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("admin.chat.openFailed"),
        );
      }
    },
    [clearActivePatient],
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        let threadIdBoot = bootThreadId;
        let resumed: ClinicChatThreadContext | null = null;
        if (initialPatient) {
          // A specific-patient hand-off (e.g. "Ask AI" from a WhatsApp chat)
          // always starts its own focused conversation, never resumes one.
          const thread = await createSessionThread(
            `Clinic · ${initialPatient.name.slice(0, 40)}`,
          );
          threadIdBoot = thread.id;
          bootThreadId = thread.id;
          await seedWelcome(thread.id, welcomeSeed());
        } else if (!threadIdBoot) {
          // threadIdBoot is only null after a real page load (it survives a
          // remount otherwise) — which used to mean a brand new thread, and
          // its welcome message, every single time the panel mounted.
          const resumable = await findResumableThread();
          if (resumable) {
            threadIdBoot = resumable.id;
            bootThreadId = resumable.id;
            resumed = (resumable.context ?? {}) as ClinicChatThreadContext;
          } else {
            const thread = await createSessionThread(
              `Clinic · ${new Date().toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`,
            );
            threadIdBoot = thread.id;
            bootThreadId = thread.id;
            await seedWelcome(thread.id, welcomeSeed());
          }
        }
        if (!alive) return;
        const rows = await listMessages(threadIdBoot);
        if (!alive) return;
        setThreadId(threadIdBoot);
        setMessages(rowsToUi(rows));
        // A resumed thread already has a real title from before this load —
        // don't let the next message silently overwrite it (see `persist`).
        setTitled(resumed !== null);
        if (initialPatient) {
          let focused = initialPatient;
          try {
            const rows = await listReservations();
            const open = findOpenReservationForPatient(rows, {
              patientKey: initialPatient.patientKey,
              phone: initialPatient.phone,
            });
            focused = {
              ...initialPatient,
              lastReservationId: open?.id,
            };
          } catch {
            /* keep patient without reservation hint */
          }
          setActivePatient(focused);
          try {
            await updateThreadContext(threadIdBoot, {
              activePatient: focused,
            });
            const focus = await appendMessage({
              threadId: threadIdBoot,
              role: "assistant",
              content: t("admin.chat.patientFocusIntro")
                .replace("{name}", focused.name)
                .replace(
                  "{phone}",
                  focused.phone ? ` · ${focused.phone}` : "",
                ),
              meta: {
                actions: patientScopedActions(focused, t),
              },
            });
            if (!alive) return;
            setMessages((prev) => [...prev, ...rowsToUi([focus])]);
          } catch {
            /* non-fatal — still show patient banner */
          }
        } else {
          setActivePatient(parseActivePatient(resumed?.activePatient));
        }
        await refreshHistory();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("admin.chat.startFailed"),
        );
        setMessages([
          {
            role: "assistant",
            content: t("admin.chat.welcome"),
            meta: { actions: getStartActions(t) },
          },
        ]);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshHistory]);

  // No onNearTop paging here — a thread loads once, unlike the WhatsApp inbox
  // this hook was built for — but "only autoscroll if already near the
  // bottom" is the same thing staff want in either chat.
  const { listRef, scrollToBottom, isNearBottom } = useChatScroll(
    messages.length + (pending || busy ? 1 : 0),
    { onNearTop: () => {} },
  );

  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && !isNearBottom()) {
      setShowJumpToBottom(true);
    }
    prevMessageCountRef.current = messages.length;
    // isNearBottom reads a ref and is recreated every render — including it
    // would run this on every render instead of only when messages arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        setShowJumpToBottom(false);
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [listRef]);

  useEffect(() => {
    if (tab === "history") void refreshHistory();
  }, [refreshHistory, tab]);

  async function fallbackActions(): Promise<ClinicChatAction[]> {
    if (!activePatient) return getStartActions(t);
    try {
      const rows = await listReservations();
      const open = findOpenReservationForPatient(rows, {
        patientKey: activePatient.patientKey,
        phone: activePatient.phone,
      });
      const hydrated = {
        ...activePatient,
        lastReservationId: open?.id,
      };
      if (hydrated.lastReservationId !== activePatient.lastReservationId) {
        setActivePatient(hydrated);
      }
      return patientScopedActions(hydrated, t);
    } catch {
      return patientScopedActions(activePatient, t);
    }
  }

  /** A failed request, kept out of the thread so it can be retried as-is. */
  const [aiError, setAiError] = useState<{
    message: string;
    transcript: AdminAiChatMessage[];
  } | null>(null);
  /** Live progress from the stream (e.g. "Looking up the patient…") while pending. */
  const [statusText, setStatusText] = useState<string | null>(null);

  async function askAi(transcript: AdminAiChatMessage[]) {
    setPending(true);
    setProposalReview(null);
    setAiError(null);
    setStatusText(null);
    try {
      const res = await fetch("/api/v1/ai/clinic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: modelTranscript(transcript, [
            WELCOME_CONTENT,
            t("admin.chat.welcome"),
          ]),
          locale,
          page: pathname,
          activePatient: activePatient
            ? {
                patientKey: activePatient.patientKey,
                name: activePatient.name,
                phone: activePatient.phone,
              }
            : null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? t("admin.chat.chatFailed"));
      }

      let donePayload: ClinicChatDonePayload | null = null;
      let streamError: string | null = null;
      await readClinicAssistStream(res, (event) => {
        if (event.type === "status") setStatusText(event.text);
        else if (event.type === "done") donePayload = event.payload as ClinicChatDonePayload;
        else if (event.type === "error") streamError = event.error;
      });
      if (streamError) throw new Error(streamError);
      if (!donePayload) throw new Error(t("admin.chat.chatFailed"));
      const body: ClinicChatDonePayload = donePayload;

      await persist(
        "assistant",
        body.reply || "…",
        body.suggestedActions?.length
          ? body.suggestedActions
          : await fallbackActions(),
      );
      if (body.dropped) {
        toast.warning(
          t("admin.chat.droppedActions").replace("{count}", String(body.dropped)),
        );
      }
      if (body.proposedActions?.length) {
        const review = await proposeFromChat({
          source: "clinic-chat",
          patientKey: activePatient?.patientKey,
          summary: body.reply ?? "Proposed changes",
          actions: body.proposedActions,
          // Client-side, so the panel and its thread survive the navigation.
          navigate: (href) => router.push(href),
        });
        if (review) setProposalReview(review);
      }
    } catch (err) {
      // Not persisted: an error is not something Clinic Assist said, and a
      // saved one was also fed back to the model as its own earlier reply.
      setAiError({
        message: err instanceof Error ? err.message : t("admin.chat.reachError"),
        transcript,
      });
    } finally {
      setPending(false);
      setStatusText(null);
    }
  }

  async function runSlash(cmd: ChatSlashCommand) {
    if (cmd.id === "help") {
      await persist("user", cmd.label);
      await persist("assistant", slashPrompt(cmd, t), await fallbackActions());
      return;
    }
    const startId = slashToStartId(cmd);
    if (startId) {
      await handleAction({ id: startId, label: cmd.label });
    }
  }

  async function send() {
    if (pending || busy) return;
    if (slashMatches.length === 1) {
      const cmd = slashMatches[0]!;
      setInput("");
      await runSlash(cmd);
      return;
    }
    if (slashMatches.length > 0) return;
    const text = input.trim();
    const pendingFiles = uploads;
    const urls = [...libraryUrls];
    if (!text && pendingFiles.length === 0 && urls.length === 0) return;
    setInput("");
    setUploads([]);
    setLibraryUrls([]);

    let uploaded: string[] = [];
    if (pendingFiles.length > 0) {
      try {
        uploaded = await Promise.all(
          pendingFiles.map(async (item) => {
            const prepared = prepareMediaFile(item.file, "image");
            return uploadPublicMedia("projects", prepared, "ai-chat-temp");
          }),
        );
      } catch (err) {
        revokePendingUploads(pendingFiles);
        toast.error(err instanceof Error ? err.message : "Upload failed");
        return;
      }
      revokePendingUploads(pendingFiles);
    }
    const imageUrls = [...uploaded, ...urls];
    const content =
      text ||
      (imageUrls.length
        ? `Attached ${imageUrls.length} image(s) for website/clinical update`
        : "");
    await persist("user", content);
    if (text && (await consumeNewPatientLine(text))) return;
    if (text && (await consumeNoteLine(text))) return;
    const userMsg: AdminAiChatMessage = {
      role: "user",
      content,
      imageUrls: imageUrls.length ? imageUrls : undefined,
    };
    await askAi([...messages, userMsg]);
  }

  async function onNewChat() {
    try {
      await startFreshSession();
      toast.success(t("admin.chat.startedNew"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("admin.chat.newFailed"),
      );
    }
  }

  async function onClearChat() {
    if (!threadId) return;
    try {
      clearActivePatient();
      setActivePatient(null);
      setTitled(false);
      setInput("");
      const welcome = await clearThread(threadId, welcomeSeed());
      setMessages(rowsToUi([welcome]));
      await refreshHistory();
      setTab("chat");
      toast.success(t("admin.chat.cleared"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.chat.clearFailed"));
    }
  }

  if (!ready) {
    return (
      <ChatShell className={className}>
        <ChatUiSkeleton showClose={Boolean(onClose)} />
      </ChatShell>
    );
  }

  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }

  return (
    <ChatShell className={className}>
      <ChatPanelHeader
        title={t("admin.chat.title")}
        subtitle={
          activePatient
            ? t("admin.chat.workingWith").replace("{name}", activePatient.name)
            : t("admin.chat.frontDesk")
        }
        onClose={onClose}
        chatLayout={chatLayout}
        onToggleChatLayout={onToggleChatLayout}
        onCollapseDock={onCollapseDock}
        onNewChat={() => void onNewChat()}
        menuActions={[
          {
            id: "clear",
            label: t("admin.chat.clearChat"),
            onClick: () => void onClearChat(),
          },
          {
            id: "history",
            label: t("admin.chat.historyTitle"),
            onClick: () => setTab("history"),
          },
        ]}
      />

      {tab === "history" ? (
        <ChatHistoryList
          threads={history}
          activeThreadId={threadId}
          onOpen={(id) => void openHistoryThread(id)}
          onNew={() => void startFreshSession()}
          onBack={() => setTab("chat")}
        />
      ) : (
        <motion.div
          key="chat-panel"
          className="flex min-h-0 flex-1 flex-col"
          variants={panelVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          transition={chatTransition(reduced)}
        >
          <AnimatePresence initial={false}>
            {activePatient ? (
              <motion.div
                key="patient-banner"
                variants={bannerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                transition={chatTransition(reduced, 0.22)}
                className="flex items-center justify-between gap-2 overflow-hidden border-b border-[var(--admin-border)] bg-[var(--admin-active)] px-3 py-1.5 text-[11px]"
              >
                <span className="truncate font-medium text-[var(--admin-primary)]">
                  {t("admin.chat.patientBanner").replace(
                    "{name}",
                    activePatient.name,
                  )}
                  {activePatient.phone ? ` · ${activePatient.phone}` : ""}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
                  onClick={() =>
                    void handleAction({
                      id: "start:patient",
                      label: t("admin.chat.action.changePatient"),
                    })
                  }
                >
                  {t("admin.chat.change")}
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div className="relative min-h-0 flex-1">
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-atomic="false"
            className="h-full space-y-3 overflow-y-auto overflow-x-hidden px-3 py-3 sm:space-y-4 sm:px-4"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div
                    key={`${msg.role}-${i}-${msg.at}-${msg.content.slice(0, 24)}`}
                    custom={isUser}
                    variants={messageVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    transition={chatTransition(reduced)}
                    layout={!reduced}
                    className={isUser ? "ms-6 sm:ms-8" : "me-0 sm:me-2"}
                  >
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className={`text-[11px] font-semibold ${CHAT_META}`}>
                        {isUser
                          ? t("admin.chat.you")
                          : t("admin.chat.reception")}
                      </span>
                      {msg.at ? (
                        <span className={`text-[10px] ${CHAT_META}`}>
                          {msg.at}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={
                        isUser
                          ? "ms-auto w-fit max-w-[min(100%,85%)] rounded-2xl px-3 py-2 text-[13px] leading-5 text-white sm:px-3.5 sm:py-2.5"
                          : CHAT_BUBBLE
                      }
                      style={
                        isUser
                          ? { background: "var(--admin-primary)" }
                          : undefined
                      }
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.content === WELCOME_CONTENT
                          ? t("admin.chat.welcome")
                          : msg.content}
                      </p>
                      {!isUser && i === lastAssistantIdx && bookPanel ? (
                        <BookBookingPanel
                          name={bookPanel.name}
                          phone={bookPanel.phone}
                          options={bookPanel.options}
                          selectedId={bookPanel.selectedId}
                          pending={busy || pending}
                          onNameChange={setBookName}
                          onPhoneChange={setBookPhone}
                          onSelectService={selectBookService}
                          onContinue={continueBookFromPanel}
                          onCancel={cancelBookPanel}
                        />
                      ) : null}
                      {!isUser && i === lastAssistantIdx && proposalReview ? (
                        <ActionReviewCard
                          review={proposalReview}
                          disabled={busy || pending}
                          onResolved={() => setProposalReview(null)}
                        />
                      ) : null}
                      {!isUser &&
                      i === lastAssistantIdx &&
                      !bookPanel &&
                      !proposalReview &&
                      msg.meta?.actions?.length &&
                      !isComposerStartSet(msg.meta.actions) ? (
                        <ActionChips
                          actions={msg.meta.actions}
                          disabled={busy || pending}
                          onPick={(a) => void handleAction(a)}
                        />
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <AnimatePresence>
              {pending || busy ? (
                <motion.p
                  key={pending && statusText ? `working-${statusText}` : "working"}
                  role="status"
                  className={`flex items-center gap-1.5 text-[12px] ${CHAT_META}`}
                  variants={workingVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <span className="inline-flex gap-0.5" aria-hidden="true">
                    <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                    <span className="size-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                    <span className="size-1 animate-bounce rounded-full bg-current" />
                  </span>
                  {pending && statusText ? statusText : t("admin.chat.working")}
                </motion.p>
              ) : null}
            </AnimatePresence>
            {aiError && !pending ? (
              <div
                role="alert"
                className="flex items-start justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800"
              >
                <span className="min-w-0 wrap-break-word">{aiError.message}</span>
                <button
                  type="button"
                  className="shrink-0 font-semibold underline-offset-2 hover:underline"
                  onClick={() => void askAi(aiError.transcript)}
                >
                  {t("admin.chat.retry")}
                </button>
              </div>
            ) : null}
          </div>
          <AnimatePresence>
            {showJumpToBottom ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1 text-[11px] font-medium text-[var(--admin-primary)] shadow-md"
                onClick={() => {
                  scrollToBottom(true);
                  setShowJumpToBottom(false);
                }}
              >
                {t("admin.chat.newMessages")}
              </motion.button>
            ) : null}
          </AnimatePresence>
          </div>

          <ChatComposerBar
            value={input}
            pending={pending || busy}
            disabled={
              pending ||
              busy ||
              (!input.trim() && uploads.length === 0 && libraryUrls.length === 0)
            }
            placeholder={
              activePatient
                ? t("admin.chat.placeholderPatient").replace(
                    "{name}",
                    activePatient.name.split(" ")[0] ?? "",
                  )
                : t("admin.chat.placeholder")
            }
            showAttach
            onOpenLibrary={() => setLibraryOpen(true)}
            onChange={setInput}
            onSend={() => void send()}
            onAddFiles={(list) => {
              if (!list) return;
              setUploads((prev) =>
                [...prev, ...createPendingUploads([...list])].slice(0, 8),
              );
            }}
            topSlot={
              <>
                <AnimatePresence initial={false}>
                  {uploads.length > 0 || libraryUrls.length > 0 ? (
                    <motion.div
                      key="uploads"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={chatTransition(reduced, 0.2)}
                      className="flex flex-wrap gap-2 overflow-hidden border-b border-[#E8EAED] px-3 py-2"
                    >
                      {uploads.map((item) => (
                        <motion.button
                          key={item.id}
                          type="button"
                          layout={!reduced}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileTap={reduced ? undefined : { scale: 0.92 }}
                          className="relative size-12 overflow-hidden rounded-lg border"
                          onClick={() =>
                            setUploads((prev) => {
                              const hit = prev.find((u) => u.id === item.id);
                              if (hit) URL.revokeObjectURL(hit.previewUrl);
                              return prev.filter((u) => u.id !== item.id);
                            })
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </motion.button>
                      ))}
                      {libraryUrls.map((url) => (
                        <motion.button
                          key={url}
                          type="button"
                          layout={!reduced}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileTap={reduced ? undefined : { scale: 0.92 }}
                          className="relative size-12 overflow-hidden rounded-lg border"
                          onClick={() =>
                            setLibraryUrls((prev) =>
                              prev.filter((u) => u !== url),
                            )
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <QuickActionBar
                  disabled={pending || busy}
                  onPick={(id) => void handleAction({ id, label: id })}
                />
                <ChatSlashMenu
                  commands={slashMatches}
                  onPick={(cmd) => {
                    setInput("");
                    void runSlash(cmd);
                  }}
                />
              </>
            }
          />
          <MediaLibraryDialog
            open={libraryOpen}
            onOpenChange={setLibraryOpen}
            defaultBucket="projects"
            onSelectExisting={(url) => {
              setLibraryUrls((prev) => [...prev, url].slice(0, 8));
              setLibraryOpen(false);
            }}
            onPickFile={(file) => {
              setUploads((prev) =>
                [...prev, ...createPendingUploads([file])].slice(0, 8),
              );
              setLibraryOpen(false);
            }}
          />
        </motion.div>
      )}
    </ChatShell>
  );
}

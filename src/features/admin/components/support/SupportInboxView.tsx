"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { inboxFilterParsers } from "@/features/admin/lib/inboxFilters";
import type { ConversationListFilters } from "@/services/whatsapp";
import { SupportChatColumn } from "./SupportChatColumn";
import { SupportChatColumnSkeleton } from "./SupportChatColumnSkeleton";
import { SupportDetailsColumn } from "./SupportDetailsColumn";
import {
  SupportInboxColumn,
  type InboxSort,
  type InboxStatusFilter,
} from "./SupportInboxColumn";
import type { ComposerSendPayload } from "./chat/composerTypes";
import {
  useWhatsappInboxLive,
  type InboxAlertView,
  type LiveInbox,
} from "./useWhatsappInboxLive";
import { mapWhatsappMessage } from "./supportWhatsappMap";
import { groupAdjacentImageMessages } from "./chat/groupAdjacentImageMessages";
import {
  CLINIC_ASSIST_CHAT_ID,
  conversationToAssistPatient,
} from "./clinicAssistChat";
import { ReceptionChat } from "@/features/admin/components/chat/reception/ReceptionChat";
import type { ActivePatient } from "@/features/admin/components/chat/reception/flowTypes";
import {
  SUPPORT_CONVERSATIONS,
  SUPPORT_DETAILS,
  SUPPORT_MESSAGES,
  getDetails,
  getMessages,
  type SupportConversation,
  type SupportDetails,
  type SupportMessage,
} from "./supportDummyData";
import { InboxColumnResizeHandle } from "./InboxColumnResizeHandle";
import { INBOX_WIDTH_MAX, INBOX_WIDTH_MIN } from "./inboxColumnWidth";
import { useInboxColumnWidth } from "./useInboxColumnWidth";
import type { WhatsappMessage } from "@/services/whatsapp";
import {
  compactPaneTransition,
  compactPaneVariants,
} from "./compactInboxMotion";

const DETAILS_WIDTH = 300;
/** Demo/showreel only: how long a sent bubble shows its pending clock. */
const DEMO_DELIVERY_MS = 700;

type Props = {
  conversations?: SupportConversation[];
  detailsById?: Record<string, SupportDetails>;
  messagesById?: Record<string, SupportMessage[]>;
  openCount?: number;
  initialCursors?: Record<string, string | null>;
  useKapso?: boolean;
  agentName?: string;
  /** Floating bubble / narrow panel layout. */
  compact?: boolean;
  onClose?: () => void;
  /** Pin Clinic Assist as first inbox row (default true on full page). */
  showClinicAssist?: boolean;
  /** False when the compact panel is hidden (floating/dock closed). */
  panelVisible?: boolean;
  onUnreadTotal?: (count: number) => void;
  inboxQ?: string;
  inboxStatus?: InboxStatusFilter;
  inboxSort?: InboxSort;
  chatLayout?: import("@/features/admin/hooks/useAdminChatLayout").AdminChatLayout;
  onToggleChatLayout?: () => void;
  onCollapseDock?: () => void;
  /** Showreel / demos: keep selection in sync with a scripted id. */
  forcedSelectedId?: string;
};

export function SupportInboxView({
  conversations: propConversations,
  detailsById: propDetailsById,
  messagesById: propMessagesById,
  openCount: propOpenCount,
  initialCursors,
  useKapso = false,
  agentName = "Front desk",
  compact = false,
  onClose,
  showClinicAssist = true,
  panelVisible = true,
  onUnreadTotal,
  inboxQ: inboxQProp = "",
  inboxStatus: inboxStatusProp = "open",
  inboxSort: inboxSortProp = "newest",
  chatLayout,
  onToggleChatLayout,
  onCollapseDock,
  forcedSelectedId,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const rtl = locale === "ar";
  const initial = useMemo<LiveInbox>(
    () => ({
      conversations: propConversations?.length
        ? propConversations
        : useKapso
          ? []
          : SUPPORT_CONVERSATIONS,
      detailsById: propDetailsById ?? {},
      messagesById: propMessagesById ?? {},
      openCount: propOpenCount ?? propConversations?.length ?? 0,
      cursorsById: initialCursors ?? {},
    }),
    [
      propConversations,
      propDetailsById,
      propMessagesById,
      propOpenCount,
      initialCursors,
      useKapso,
    ],
  );

  const [isFilterPending, startTransition] = useTransition();
  const [urlInbox, setUrlInbox] = useQueryStates(inboxFilterParsers, {
    shallow: false,
    history: "replace",
    startTransition,
  });

  // Compact bubble keeps local filters (avoid writing iq/istatus onto unrelated routes).
  const [localFilter, setLocalFilter] =
    useState<InboxStatusFilter>(inboxStatusProp);
  const [localSort, setLocalSort] = useState<InboxSort>(inboxSortProp);
  const [localSearch, setLocalSearch] = useState(inboxQProp);
  const [searchDraft, setSearchDraft] = useState(
    compact ? inboxQProp : urlInbox.iq || inboxQProp,
  );

  const inboxFilter: InboxStatusFilter = compact
    ? localFilter
    : urlInbox.istatus;
  const inboxSort: InboxSort = compact ? localSort : urlInbox.isort;
  const inboxSearch = compact ? localSearch : urlInbox.iq;

  const conversationFilters = useMemo<ConversationListFilters>(
    () => ({
      q: inboxSearch,
      status: inboxFilter,
      sort: inboxSort,
    }),
    [inboxFilter, inboxSearch, inboxSort],
  );

  const alertViewRef = useRef<InboxAlertView>({
    selectedId: "",
    threadVisible: panelVisible,
  });
  const live = useWhatsappInboxLive(
    useKapso,
    initial,
    agentName,
    conversationFilters,
    { viewRef: alertViewRef, onUnreadTotal },
  );
  const {
    conversations,
    detailsById,
    messagesById,
    openCount,
    cursorsById,
    filterLoading,
    prependPage,
    replaceConversationMessages,
    patchDetails,
    patchConversationStatus,
    touchConversation,
  } = live;
  const listLoading = useKapso && (filterLoading || isFilterPending);

  const reduced = useReducedMotion();
  const {
    width: inboxWidth,
    dragging: inboxResizing,
    startResize: startInboxResize,
  } = useInboxColumnWidth();
  const [selectedId, setSelectedId] = useState(
    forcedSelectedId || conversations[0]?.id || "",
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [extraMessages, setExtraMessages] = useState<
    Record<string, SupportMessage[]>
  >({});
  const [draftsById, setDraftsById] = useState<Record<string, string>>({});
  const [replyById, setReplyById] = useState<
    Record<string, SupportMessage | null>
  >({});
  const [sending, setSending] = useState(false);
  /** Demo mode has no send API to report delivery back — see handleSend. */
  const demoTickTimersRef = useRef<number[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [assistPatient, setAssistPatient] = useState<ActivePatient | null>(
    null,
  );
  const [assistReturnId, setAssistReturnId] = useState("");
  /** Messenger list↔chat for floating bubble only. */
  const [compactPane, setCompactPane] = useState<"list" | "thread">(
    compact && forcedSelectedId ? "thread" : "list",
  );
  /** +1 open thread, -1 back to the list — drives slide direction. */
  const [paneDir, setPaneDir] = useState(1);
  alertViewRef.current = {
    selectedId,
    threadVisible: compact
      ? panelVisible && compactPane === "thread"
      : panelVisible,
  };

  useEffect(() => {
    setSearchDraft(inboxSearch);
  }, [inboxSearch]);

  useEffect(() => {
    const timers = demoTickTimersRef;
    return () => {
      timers.current.forEach((handle) => window.clearTimeout(handle));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === inboxSearch) return;
      if (compact) {
        setLocalSearch(searchDraft);
      } else {
        void setUrlInbox({ iq: searchDraft });
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [compact, inboxSearch, searchDraft, setUrlInbox]);

  function setInboxFilter(next: InboxStatusFilter) {
    if (compact) startTransition(() => setLocalFilter(next));
    else void setUrlInbox({ istatus: next });
  }

  function setInboxSort(next: InboxSort) {
    if (compact) startTransition(() => setLocalSort(next));
    else void setUrlInbox({ isort: next });
  }

  function setInboxSearch(next: string) {
    setSearchDraft(next);
  }

  function goToThread() {
    setPaneDir(1);
    setCompactPane("thread");
  }

  function goToList() {
    setPaneDir(-1);
    setCompactPane("list");
  }

  useEffect(() => {
    if (!selectedId && conversations[0]?.id) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    if (!forcedSelectedId) return;
    setSelectedId(forcedSelectedId);
    if (compact) {
      setPaneDir(1);
      setCompactPane("thread");
    }
  }, [forcedSelectedId, compact, panelVisible]);

  useEffect(() => {
    if (!useKapso || !selectedId || selectedId === CLINIC_ASSIST_CHAT_ID) {
      return;
    }
    void fetch("/api/v1/whatsapp/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId }),
    }).catch(() => undefined);
  }, [selectedId, useKapso]);

  const fetchedMsgIds = useRef(new Set<string>());
  useEffect(() => {
    if (!useKapso || !selectedId || selectedId === CLINIC_ASSIST_CHAT_ID) {
      return;
    }
    const existing = messagesById[selectedId];
    if (existing && existing.length > 0) {
      fetchedMsgIds.current.add(selectedId);
      return;
    }
    if (fetchedMsgIds.current.has(selectedId)) return;
    fetchedMsgIds.current.add(selectedId);
    let cancelled = false;
    void (async () => {
      const url = new URL("/api/v1/whatsapp/messages", window.location.origin);
      url.searchParams.set("conversationId", selectedId);
      url.searchParams.set("limit", "40");
      const res = await fetch(url.toString());
      if (!res.ok || cancelled) {
        fetchedMsgIds.current.delete(selectedId);
        return;
      }
      const data = (await res.json()) as {
        messages: WhatsappMessage[];
        nextCursor: string | null;
      };
      const contactName =
        conversations.find((c) => c.id === selectedId)?.name ??
        t("admin.frontDesk.patient");
      replaceConversationMessages(
        selectedId,
        data.messages.map((m) =>
          mapWhatsappMessage(m, contactName, agentName),
        ),
        data.nextCursor,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [
    agentName,
    conversations,
    messagesById,
    replaceConversationMessages,
    selectedId,
    t,
    useKapso,
  ]);

  const clinicAssistConversation = useMemo<SupportConversation>(
    () => ({
      id: CLINIC_ASSIST_CHAT_ID,
      name: t("admin.chat.title"),
      initials: "AI",
      avatarColor: "#EEF2FF",
      preview: t("admin.frontDesk.aiPreview"),
      timestamp: "",
      tags: [{ label: t("admin.frontDesk.aiTag") }],
      starred: true,
      status: "active",
    }),
    [t],
  );

  const filteredConversations = useMemo(() => {
    // Client filter keeps the tab correct while live refresh catches up to URL filters.
    let list = conversations;
    if (inboxFilter === "open") {
      list = conversations.filter(
        (c) => c.status === "active" || c.status === "ended" || !c.status,
      );
    } else if (inboxFilter === "archived") {
      list = conversations.filter((c) => c.status === "archived");
    }

    const q = inboxSearch.trim().toLowerCase();
    const aiHay = [
      clinicAssistConversation.name,
      clinicAssistConversation.preview,
      clinicAssistConversation.tags.map((tag) => tag.label).join(" "),
    ]
      .join(" ")
      .toLowerCase();
    const showAi =
      showClinicAssist &&
      inboxFilter !== "archived" &&
      (!q || aiHay.includes(q));
    return showAi ? [clinicAssistConversation, ...list] : list;
  }, [
    clinicAssistConversation,
    conversations,
    inboxFilter,
    inboxSearch,
    showClinicAssist,
  ]);

  const conversation = useMemo(
    () => {
      if (selectedId === CLINIC_ASSIST_CHAT_ID) {
        return clinicAssistConversation;
      }
      return (
        filteredConversations.find((c) => c.id === selectedId) ??
        filteredConversations[0]
      );
    },
    [clinicAssistConversation, filteredConversations, selectedId],
  );
  const isAiChat = conversation?.id === CLINIC_ASSIST_CHAT_ID;

  const messages = useMemo(() => {
    if (!selectedId || selectedId === CLINIC_ASSIST_CHAT_ID) return [];
    const base =
      messagesById[selectedId] ??
      SUPPORT_MESSAGES[selectedId] ??
      (useKapso ? [] : getMessages(selectedId));
    const extras = extraMessages[selectedId] ?? [];
    const ids = new Set(base.map((m) => m.id));
    const merged = [...base, ...extras.filter((m) => !ids.has(m.id))];
    return groupAdjacentImageMessages(merged);
  }, [extraMessages, messagesById, selectedId, useKapso]);

  const details =
    (selectedId && detailsById[selectedId]) ||
    (selectedId && SUPPORT_DETAILS[selectedId]) ||
    (useKapso
      ? {
          attributes: [],
          clientData: [],
          tickets: [],
          notes: [],
        }
      : getDetails(selectedId || "jasper"));

  const duration = reduced ? 0.01 : 0.28;
  const ease = [0.22, 1, 0.36, 1] as const;
  const paneTransition = compactPaneTransition(reduced);
  const paneVariants = useMemo(() => compactPaneVariants(rtl), [rtl]);

  async function handleLoadMore() {
    if (!useKapso || !selectedId || loadingMore) return;
    const cursor = cursorsById[selectedId];
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const url = new URL("/api/v1/whatsapp/messages", window.location.origin);
      url.searchParams.set("conversationId", selectedId);
      url.searchParams.set("before", cursor);
      url.searchParams.set("limit", "30");
      const res = await fetch(url.toString());
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: WhatsappMessage[];
        nextCursor: string | null;
      };
      const contactName = conversation?.name ?? t("admin.frontDesk.patient");
      prependPage(
        selectedId,
        data.messages.map((m) =>
          mapWhatsappMessage(m, contactName, agentName),
        ),
        data.nextCursor,
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend(payload: ComposerSendPayload) {
    const id = conversation?.id;
    if (!id) return;

    const optimisticId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const timeLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const body = payload.text ?? "";
    const messageType =
      payload.kind === "interactive_buttons" ||
      payload.kind === "interactive_cta"
        ? "interactive"
        : payload.kind;
    const preview =
      body.trim() ||
      (messageType === "image"
        ? "Photo"
        : messageType === "audio"
          ? "Voice message"
          : messageType === "video"
            ? "Video"
            : messageType === "document"
              ? "Document"
              : messageType === "location"
                ? "Location"
                : messageType === "interactive"
                  ? "Form"
                  : "Message");

    const optimistic: SupportMessage = {
      id: optimisticId,
      author: "agent",
      authorName: agentName,
      body,
      time: timeLabel,
      status: "pending",
      statusTimestamps: {},
      media: payload.localMedia,
      flow: payload.flow ?? null,
      replyTo: payload.replyTo ?? null,
      messageType,
      waTimestamp: nowIso,
    };
    setExtraMessages((prev) => ({
      ...prev,
      [id]: [...(prev[id] ?? []), optimistic],
    }));
    setDraftsById((prev) => ({ ...prev, [id]: "" }));
    setReplyById((prev) => ({ ...prev, [id]: null }));
    touchConversation(id, {
      preview,
      lastMessageType: messageType,
      lastMessageAt: nowIso,
      lastMessageStatus: "pending",
      timestamp: timeLabel,
    });

    if (!useKapso) {
      // Persist onto demo inbox so float ↔ dock remounts keep the send.
      const prior = messagesById[id] ?? [];
      if (!prior.some((m) => m.id === optimisticId)) {
        messagesById[id] = [...prior, optimistic];
      }
      // No send API here to report delivery back, so walk the ticks forward
      // the way a real send does — otherwise the bubble sits on "pending".
      const handle = window.setTimeout(() => {
        const delivered: SupportMessage = {
          ...optimistic,
          status: "delivered",
          statusTimestamps: {
            sent_at: nowIso,
            delivered_at: new Date().toISOString(),
          },
        };
        setExtraMessages((prev) => ({
          ...prev,
          [id]: (prev[id] ?? []).map((m) =>
            m.id === optimisticId ? delivered : m,
          ),
        }));
        messagesById[id] = (messagesById[id] ?? []).map((m) =>
          m.id === optimisticId ? delivered : m,
        );
        touchConversation(id, { lastMessageStatus: "delivered" });
      }, DEMO_DELIVERY_MS);
      demoTickTimersRef.current.push(handle);
      return;
    }

    setSending(true);
    try {
      let res: Response;
      if (payload.file) {
        const form = new FormData();
        form.set("conversationId", id);
        form.set("kind", payload.kind);
        if (payload.text) form.set("text", payload.text);
        form.set("file", payload.file);
        if (payload.replyTo) {
          form.set("replyToWamid", payload.replyTo.wamid);
          form.set("replyToAuthor", payload.replyTo.authorName);
          form.set("replyToBody", payload.replyTo.body);
        }
        res = await fetch("/api/v1/whatsapp/send", {
          method: "POST",
          body: form,
        });
      } else {
        res = await fetch("/api/v1/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: id,
            kind: payload.kind,
            text: payload.text,
            buttons: payload.buttons,
            ctaLabel: payload.ctaLabel,
            ctaUrl: payload.ctaUrl,
            location: payload.location,
            replyTo: payload.replyTo,
          }),
        });
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          code?: string;
        } | null;
        if (err?.code === "SESSION_EXPIRED") {
          toast.error(t("admin.frontDesk.sessionExpiredTitle"));
        }
        throw new Error("send failed");
      }
      const data = (await res.json()) as { message?: WhatsappMessage };
      if (data.message) {
        const mapped = mapWhatsappMessage(
          data.message,
          conversation?.name ?? t("admin.frontDesk.patient"),
          agentName,
        );
        mapped.author = "agent";
        mapped.authorName = agentName;
        if (payload.localMedia?.length && !mapped.media?.some((m) => m.url)) {
          mapped.media = payload.localMedia;
        }
        setExtraMessages((prev) => ({
          ...prev,
          [id]: (prev[id] ?? []).map((m) =>
            m.id === optimisticId ? mapped : m,
          ),
        }));
        touchConversation(id, {
          preview: mapped.body || preview,
          lastMessageType: mapped.messageType ?? messageType,
          lastMessageAt: mapped.waTimestamp ?? nowIso,
          lastMessageStatus: mapped.status ?? "sent",
          timestamp: mapped.time || timeLabel,
        });
      }
    } catch {
      setExtraMessages((prev) => ({
        ...prev,
        [id]: (prev[id] ?? []).map((m) =>
          m.id === optimisticId ? { ...m, status: "failed" as const } : m,
        ),
      }));
      touchConversation(id, { lastMessageStatus: "failed" });
    } finally {
      setSending(false);
    }
  }

  async function handleSendTemplate(payload: {
    name: string;
    language: string;
    parameterFormat: "POSITIONAL" | "NAMED";
    fields: { section: "header" | "body"; key: string; label: string }[];
    values: Record<string, string>;
  }): Promise<boolean> {
    if (!useKapso || !selectedId || selectedId === CLINIC_ASSIST_CHAT_ID) {
      return false;
    }
    const id = selectedId;
    setSending(true);
    try {
      const res = await fetch("/api/v1/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: id,
          kind: "template",
          template: payload,
        }),
      });
      if (!res.ok) {
        toast.error(t("admin.frontDesk.templateSendFail"));
        return false;
      }
      const data = (await res.json()) as { message?: WhatsappMessage };
      if (data.message) {
        const mapped = mapWhatsappMessage(
          data.message,
          conversation?.name ?? t("admin.frontDesk.patient"),
          agentName,
        );
        mapped.author = "agent";
        mapped.authorName = agentName;
        setExtraMessages((prev) => ({
          ...prev,
          [id]: [...(prev[id] ?? []), mapped],
        }));
        const timeLabel = mapped.time || "";
        touchConversation(id, {
          preview: mapped.body || `Template: ${payload.name}`,
          lastMessageType: "template",
          lastMessageAt: mapped.waTimestamp,
          lastMessageStatus: mapped.status ?? "sent",
          timestamp: timeLabel,
        });
      }
      toast.success(t("admin.frontDesk.templateSendOk"));
      return true;
    } catch {
      toast.error(t("admin.frontDesk.templateSendFail"));
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleArchiveToggle() {
    if (!useKapso || !conversation || archiving) return;
    const nextStatus =
      conversation.status === "archived" ? "active" : "archived";
    setArchiving(true);
    try {
      const res = await fetch("/api/v1/whatsapp/conversations/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        toast.error(
          nextStatus === "archived"
            ? t("admin.frontDesk.archiveFail")
            : t("admin.frontDesk.unarchiveFail"),
        );
        return;
      }
      patchConversationStatus(conversation.id, nextStatus);
      toast.success(
        nextStatus === "archived"
          ? t("admin.frontDesk.archiveOk")
          : t("admin.frontDesk.unarchiveOk"),
      );
      if (nextStatus === "archived" && inboxFilter === "open") {
        const next = conversations.find(
          (c) =>
            c.id !== conversation.id && (c.status ?? "active") === "active",
        );
        setSelectedId(next?.id ?? "");
      }
    } catch {
      toast.error(t("admin.frontDesk.updateFail"));
    } finally {
      setArchiving(false);
    }
  }

  async function addNote(body: string) {
    if (!useKapso || !selectedId || !body.trim()) return;
    const res = await fetch("/api/v1/whatsapp/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, body }),
    });
    if (!res.ok) {
      toast.error(t("admin.frontDesk.noteSaveFail"));
      return;
    }
    const data = (await res.json()) as {
      note: {
        id: string;
        author: string;
        body: string;
        pinned: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    patchDetails(selectedId, {
      notes: [
        {
          id: data.note.id,
          author: data.note.author,
          body: data.note.body,
          pinned: data.note.pinned,
          createdAt: data.note.created_at,
          updatedAt: data.note.updated_at,
        },
        ...details.notes,
      ],
    });
    toast.success(t("admin.frontDesk.noteSaved"));
  }

  async function togglePinNote(noteId: string, pinned: boolean) {
    if (!useKapso || !selectedId) return;
    const res = await fetch("/api/v1/whatsapp/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteId, pinned }),
    });
    if (!res.ok) {
      toast.error(t("admin.frontDesk.noteUpdateFail"));
      return;
    }
    patchDetails(selectedId, {
      notes: details.notes.map((n) =>
        n.id === noteId ? { ...n, pinned } : n,
      ),
    });
  }

  async function editNote(noteId: string, body: string) {
    if (!useKapso || !selectedId || !body.trim()) return;
    const res = await fetch("/api/v1/whatsapp/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteId, body }),
    });
    if (!res.ok) {
      toast.error(t("admin.frontDesk.noteUpdateFail"));
      return;
    }
    const data = (await res.json()) as {
      note: { updated_at?: string; body: string };
    };
    patchDetails(selectedId, {
      notes: details.notes.map((n) =>
        n.id === noteId
          ? {
              ...n,
              body: data.note.body,
              updatedAt: data.note.updated_at ?? new Date().toISOString(),
            }
          : n,
      ),
    });
    toast.success(t("admin.frontDesk.noteSaved"));
  }

  async function deleteNote(noteId: string) {
    if (!useKapso || !selectedId) return;
    const res = await fetch(
      `/api/v1/whatsapp/notes?id=${encodeURIComponent(noteId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      toast.error(t("admin.frontDesk.noteDeleteFail"));
      return;
    }
    patchDetails(selectedId, {
      notes: details.notes.filter((n) => n.id !== noteId),
    });
    toast.success(t("admin.frontDesk.noteDeleted"));
  }

  const emptyFilterCopy =
    inboxFilter === "archived"
      ? t("admin.frontDesk.emptyArchived")
      : useKapso
        ? t("admin.frontDesk.emptyKapso")
        : t("admin.frontDesk.emptyClinic");

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-1 overflow-hidden bg-white font-sans text-[#111827]",
        compact && "relative",
      )}
    >
      {compact ? (
        <AnimatePresence initial={false} custom={paneDir}>
          {compactPane === "list" || !conversation ? (
            <motion.div
              key="compact-list"
              className="absolute inset-0 flex min-h-0 flex-col"
              custom={paneDir}
              variants={paneVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={paneTransition}
            >
              <SupportInboxColumn
                title={t("admin.frontDesk.title")}
                openLabel={t("admin.frontDesk.openCount").replace(
                  "{count}",
                  String(openCount),
                )}
                conversations={filteredConversations}
                selectedId={selectedId || conversation?.id || ""}
                onSelect={(id) => {
                  if (id === CLINIC_ASSIST_CHAT_ID) {
                    setAssistPatient(null);
                  }
                  setSelectedId(id);
                  goToThread();
                }}
                filter={inboxFilter}
                onFilterChange={setInboxFilter}
                sort={inboxSort}
                onSortChange={setInboxSort}
                search={searchDraft}
                onSearchChange={setInboxSearch}
                compact
                loading={listLoading}
                onClose={onClose}
                chatLayout={chatLayout}
                onToggleChatLayout={onToggleChatLayout}
                onCollapseDock={onCollapseDock}
              />
            </motion.div>
          ) : isAiChat ? (
            <motion.div
              key="compact-thread-ai"
              className="absolute inset-0 flex min-h-0 min-w-0 flex-col bg-white"
              custom={paneDir}
              variants={paneVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={paneTransition}
            >
              <div
                data-showreel-action="clinic-assist-chat"
                className="flex h-full min-h-0 flex-col"
              >
                <ReceptionChat
                  key={
                    assistPatient
                      ? `assist-${assistPatient.patientKey}`
                      : "assist-default"
                  }
                  className="h-full min-h-0"
                  statsSummary={t("admin.chat.title")}
                  initialPatient={assistPatient}
                  chatLayout={chatLayout}
                  onToggleChatLayout={onToggleChatLayout}
                  onCollapseDock={onCollapseDock}
                  onClose={() => {
                    setAssistPatient(null);
                    setAssistReturnId("");
                    setSelectedId(assistReturnId || selectedId);
                    goToList();
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="compact-thread"
              className="absolute inset-0 flex min-h-0 min-w-0 flex-col bg-white"
              custom={paneDir}
              variants={paneVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={paneTransition}
            >
              <SupportChatColumn
                conversation={conversation}
                messages={messages}
                draft={draftsById[conversation.id] ?? ""}
                onDraftChange={(value) =>
                  setDraftsById((prev) => ({
                    ...prev,
                    [conversation.id]: value,
                  }))
                }
                replyTo={replyById[conversation.id] ?? null}
                onReply={(message) =>
                  setReplyById((prev) => ({
                    ...prev,
                    [conversation.id]: message,
                  }))
                }
                onClearReply={() =>
                  setReplyById((prev) => ({
                    ...prev,
                    [conversation.id]: null,
                  }))
                }
                detailsOpen={false}
                showWorkspace
                onBack={goToList}
                onClose={onClose}
                onLoadMore={() => {
                  void handleLoadMore();
                }}
                loadingMore={loadingMore}
                sending={sending}
                archiving={archiving}
                onArchiveToggle={
                  useKapso ? () => void handleArchiveToggle() : undefined
                }
                onAskAi={() => {
                  setAssistReturnId(conversation.id);
                  setAssistPatient(conversationToAssistPatient(conversation));
                  setSelectedId(CLINIC_ASSIST_CHAT_ID);
                  goToThread();
                }}
                onSend={(payload) => {
                  if (sending) return;
                  void handleSend(payload);
                }}
                onSendTemplate={
                  useKapso
                    ? (payload) => handleSendTemplate(payload)
                    : undefined
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <>
          <div className="flex h-full min-h-0 shrink-0 flex-col">
            <SupportInboxColumn
              title={t("admin.frontDesk.title")}
              openLabel={t("admin.frontDesk.openCount").replace(
                "{count}",
                String(openCount),
              )}
              conversations={filteredConversations}
              selectedId={selectedId || conversation?.id || ""}
              onSelect={(id) => {
                if (id === CLINIC_ASSIST_CHAT_ID) {
                  setAssistPatient(null);
                }
                setSelectedId(id);
              }}
              filter={inboxFilter}
              onFilterChange={setInboxFilter}
              sort={inboxSort}
              onSortChange={setInboxSort}
              search={searchDraft}
              onSearchChange={setInboxSearch}
              widthPx={inboxWidth}
              loading={listLoading}
            />
          </div>
          <InboxColumnResizeHandle
            width={inboxWidth}
            min={INBOX_WIDTH_MIN}
            max={INBOX_WIDTH_MAX}
            labelKey="admin.frontDesk.resizeInbox"
            dragging={inboxResizing}
            onPointerDown={startInboxResize}
          />
          {listLoading ? (
            <SupportChatColumnSkeleton />
          ) : isAiChat ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
              <ReceptionChat
                key={
                  assistPatient
                    ? `assist-${assistPatient.patientKey}`
                    : "assist-default"
                }
                className="h-full min-h-0"
                statsSummary={t("admin.chat.title")}
                initialPatient={assistPatient}
              />
            </div>
          ) : conversation ? (
            <>
              <SupportChatColumn
                conversation={conversation}
                messages={messages}
                draft={draftsById[conversation.id] ?? ""}
                onDraftChange={(value) =>
                  setDraftsById((prev) => ({
                    ...prev,
                    [conversation.id]: value,
                  }))
                }
                replyTo={replyById[conversation.id] ?? null}
                onReply={(message) =>
                  setReplyById((prev) => ({
                    ...prev,
                    [conversation.id]: message,
                  }))
                }
                onClearReply={() =>
                  setReplyById((prev) => ({
                    ...prev,
                    [conversation.id]: null,
                  }))
                }
                detailsOpen={detailsOpen}
                onToggleDetails={() => setDetailsOpen((v) => !v)}
                showWorkspace
                onLoadMore={() => {
                  void handleLoadMore();
                }}
                loadingMore={loadingMore}
                sending={sending}
                archiving={archiving}
                onArchiveToggle={
                  useKapso ? () => void handleArchiveToggle() : undefined
                }
                onAskAi={() => {
                  setAssistReturnId(conversation.id);
                  setAssistPatient(conversationToAssistPatient(conversation));
                  setSelectedId(CLINIC_ASSIST_CHAT_ID);
                }}
                onSend={(payload) => {
                  if (sending) return;
                  void handleSend(payload);
                }}
                onSendTemplate={
                  useKapso
                    ? (payload) => handleSendTemplate(payload)
                    : undefined
                }
              />
              <AnimatePresence initial={false}>
                {detailsOpen ? (
                  <motion.div
                    key="support-details"
                    className="h-full shrink-0 overflow-hidden"
                    initial={
                      reduced
                        ? { width: DETAILS_WIDTH, opacity: 1 }
                        : { width: 0, opacity: 0 }
                    }
                    animate={{ width: DETAILS_WIDTH, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration, ease }}
                  >
                    <div className="h-full w-[300px]">
                      <SupportDetailsColumn
                        details={details}
                        messages={messages}
                        onToggleDetails={() => setDetailsOpen(false)}
                        onAddNote={addNote}
                        onTogglePinNote={togglePinNote}
                        onEditNote={editNote}
                        onDeleteNote={deleteNote}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-white px-6 text-center text-sm text-[#6B7280]">
              {emptyFilterCopy}
            </div>
          )}
        </>
      )}
    </div>
  );
}

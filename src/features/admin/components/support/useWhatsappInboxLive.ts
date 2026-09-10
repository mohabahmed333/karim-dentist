"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type {
  WhatsappConversation,
  WhatsappNote,
} from "@/services/whatsapp";
import {
  listConversations,
  type ConversationListFilters,
} from "@/services/whatsapp/queries";
import {
  mapWhatsappMessage,
  mapWhatsappToSupportUi,
} from "./supportWhatsappMap";
import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
} from "./supportDummyData";
import {
  parseUnreadCount,
  takeInboundChime,
  unreadTotalFromConversations,
} from "@/features/admin/lib/whatsappInboundAlert";
import {
  playWhatsappInboundChime,
  unlockWhatsappInboundChime,
} from "@/features/admin/lib/whatsappInboundChime";
import { subscribeWhatsappLive } from "@/features/admin/lib/whatsappLiveClient";
import { mergeSupportMessages } from "@/features/admin/lib/whatsappLiveApply";

export type InboxAlertView = {
  selectedId: string;
  threadVisible: boolean;
};

export type InboxLiveAlert = {
  viewRef?: RefObject<InboxAlertView | null>;
  onUnreadTotal?: (count: number) => void;
};

export type LiveInbox = {
  conversations: SupportConversation[];
  detailsById: Record<string, SupportDetails>;
  messagesById: Record<string, SupportMessage[]>;
  openCount: number;
  cursorsById: Record<string, string | null>;
};

export function useWhatsappInboxLive(
  enabled: boolean,
  initial: LiveInbox,
  agentName = "Front desk",
  conversationFilters?: ConversationListFilters | null,
  alert?: InboxLiveAlert,
) {
  const viewRef = alert?.viewRef;
  const onUnreadRef = useRef(alert?.onUnreadTotal);
  onUnreadRef.current = alert?.onUnreadTotal;
  const [live, setLive] = useState(initial);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    if (enabled) return;
    setLive(initial);
  }, [enabled, initial]);
  const prevFilterKeyRef = useRef<string | null>(null);
  const filterKey = JSON.stringify(conversationFilters ?? null);
  const filters = useMemo((): ConversationListFilters | null => {
    if (!conversationFilters) return null;
    return {
      q: conversationFilters.q,
      status: conversationFilters.status,
      sort: conversationFilters.sort,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilize by filterKey
  }, [filterKey]);

  useEffect(() => {
    if (enabled && initial.conversations.length === 0) return;
    setLive((prev) => ({
      ...initial,
      // Keep any pages already loaded for the same conversation ids
      messagesById: {
        ...initial.messagesById,
        ...Object.fromEntries(
          Object.entries(prev.messagesById).map(([id, msgs]) => {
            const seed = initial.messagesById[id] ?? [];
            if (msgs.length <= seed.length) return [id, seed];
            return [id, msgs];
          }),
        ),
      },
      cursorsById: {
        ...initial.cursorsById,
        ...prev.cursorsById,
      },
    }));
  }, [enabled, initial]);

  const refreshConversations = useCallback(async () => {
    const supabase = createClient();
    let conversations: WhatsappConversation[] = [];
    try {
      conversations = await listConversations(supabase, filters);
    } catch {
      return;
    }

    const notesByConversation: Record<string, WhatsappNote[]> = {};
    await Promise.all(
      conversations.slice(0, 40).map(async (c) => {
        const { data } = await supabase
          .from("whatsapp_notes")
          .select("*")
          .eq("conversation_id", c.id)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });
        notesByConversation[c.id] = (data as WhatsappNote[]) ?? [];
      }),
    );

    const { data: reservations } = await supabase
      .from("reservations")
      .select("*")
      .is("deleted_at", null)
      .order("starts_at", { ascending: true });

    const patientGroups = groupReservationsByPatient(
      (reservations as Reservation[] | null) ?? [],
    );

    setLive((prev) => {
      const mapped = mapWhatsappToSupportUi(
        conversations,
        {},
        notesByConversation,
        patientGroups,
        agentName,
      );
      return {
        ...prev,
        conversations: mapped.uiConversations,
        detailsById: mapped.detailsById,
        openCount: mapped.openCount,
      };
    });
  }, [agentName, filters]);

  const prependPage = useCallback(
    (
      conversationId: string,
      older: SupportMessage[],
      nextCursor: string | null,
    ) => {
      setLive((prev) => {
        const existing = prev.messagesById[conversationId] ?? [];
        const ids = new Set(existing.map((m) => m.id));
        const merged = [...older.filter((m) => !ids.has(m.id)), ...existing];
        return {
          ...prev,
          messagesById: { ...prev.messagesById, [conversationId]: merged },
          cursorsById: {
            ...prev.cursorsById,
            [conversationId]: nextCursor,
          },
        };
      });
    },
    [],
  );

  const patchDetails = useCallback(
    (conversationId: string, patch: Partial<SupportDetails>) => {
      setLive((prev) => {
        const current = prev.detailsById[conversationId];
        if (!current) return prev;
        return {
          ...prev,
          detailsById: {
            ...prev.detailsById,
            [conversationId]: { ...current, ...patch },
          },
        };
      });
    },
    [],
  );

  const patchConversationStatus = useCallback(
    (conversationId: string, status: "active" | "archived") => {
      setLive((prev) => {
        const conversations = prev.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          const tags = c.tags.filter(
            (t) => t.label !== "Archived" && t.label !== "Ended",
          );
          if (status === "archived") {
            tags.push({ label: "Archived" });
          }
          return { ...c, status, tags };
        });
        return {
          ...prev,
          conversations,
          openCount: conversations.filter((c) => c.status === "active").length,
        };
      });
    },
    [],
  );

  const touchConversation = useCallback(
    (
      conversationId: string,
      patch: {
        preview?: string;
        lastMessageType?: string;
        lastMessageAt?: string;
        lastMessageStatus?: SupportMessage["status"];
        timestamp?: string;
      },
    ) => {
      setLive((prev) => {
        const current = prev.conversations.find((c) => c.id === conversationId);
        if (!current) return prev;
        const next: SupportConversation = {
          ...current,
          ...patch,
          preview: patch.preview ?? current.preview,
          lastMessageType: patch.lastMessageType ?? current.lastMessageType,
          lastMessageAt: patch.lastMessageAt ?? current.lastMessageAt,
          lastMessageStatus:
            patch.lastMessageStatus ?? current.lastMessageStatus,
          timestamp: patch.timestamp ?? current.timestamp,
        };
        const rest = prev.conversations.filter((c) => c.id !== conversationId);
        return {
          ...prev,
          conversations: [next, ...rest],
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    const isFilterChange =
      prevFilterKeyRef.current !== null &&
      prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    let cancelled = false;
    if (isFilterChange) setFilterLoading(true);
    void refreshConversations().finally(() => {
      if (!cancelled && isFilterChange) setFilterLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, filterKey, refreshConversations]);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();
    let cancelled = false;
    async function pull() {
      try {
        const conversations = await listConversations(supabase, filters);
        if (cancelled) return;
        setLive((prev) => {
          const mapped = mapWhatsappToSupportUi(
            conversations,
            {},
            {},
            [],
            agentName,
          );
          const prevById = new Map(
            prev.conversations.map((row) => [row.id, row]),
          );
          return {
            ...prev,
            conversations: mapped.uiConversations.map((row) => {
              const older = prevById.get(row.id);
              if (!older) return row;
              return {
                ...older,
                preview: row.preview,
                lastMessageType: row.lastMessageType,
                lastMessageAt: row.lastMessageAt,
                lastMessageStatus: row.lastMessageStatus,
                lastInboundAt: row.lastInboundAt,
                sessionOpen: row.sessionOpen,
                timestamp: row.timestamp,
                status: row.status,
                unread: row.unread,
              };
            }),
            openCount: mapped.openCount,
          };
        });
      } catch {
        /* keep last list */
      }
    }
    const pollId = window.setInterval(pull, 3000);
    function onVis() {
      if (document.visibilityState === "visible") void pull();
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", pull);
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", pull);
    };
  }, [enabled, filters, agentName]);

  useEffect(() => {
    if (!enabled) return;

    const unsub = subscribeWhatsappLive((event) => {
      if (event.table !== "whatsapp_messages") {
        void refreshConversations();
        return;
      }
      const row = event.row;
      if (!row?.conversation_id) {
        void refreshConversations();
        return;
      }
      const view = viewRef?.current;
      if (
        takeInboundChime({
          eventType: event.eventType,
          direction: row.direction,
          conversationId: row.conversation_id,
          messageId: row.id,
          selectedConversationId: view?.selectedId ?? "",
          threadVisible: view?.threadVisible ?? false,
        })
      ) {
        playWhatsappInboundChime();
      }
      setLive((prev) => {
        const conv = prev.conversations.find(
          (c) => c.id === row.conversation_id,
        );
        const mapped = mapWhatsappMessage(
          row,
          conv?.name ?? "Patient",
          agentName,
        );
        const existing = prev.messagesById[row.conversation_id] ?? [];
        let nextMsgs: SupportMessage[];
        if (event.eventType === "DELETE") {
          nextMsgs = existing.filter((m) => m.id !== row.id);
        } else {
          const idx = existing.findIndex((m) => m.id === mapped.id);
          if (idx >= 0) {
            nextMsgs = [...existing];
            nextMsgs[idx] = mapped;
          } else {
            const withoutLocal = existing.filter(
              (m) =>
                !(
                  m.id.startsWith("local-") &&
                  m.body === mapped.body &&
                  m.author === "agent"
                ),
            );
            nextMsgs = [...withoutLocal, mapped].sort((a, b) =>
              (a.waTimestamp ?? "").localeCompare(b.waTimestamp ?? ""),
            );
          }
        }

        // A draft appears in the thread but was never delivered, so it must not
        // become the conversation's preview, timestamp or last-message status.
        // This is the one place a draft could silently show staff, in the inbox
        // list, text the patient never received.
        const isLatest =
          event.eventType !== "DELETE" &&
          !mapped.isDraft &&
          nextMsgs[nextMsgs.length - 1]?.id === mapped.id;
        let conversations = prev.conversations;
        if (isLatest && conv) {
          const inbound = mapped.author === "customer";
          const unreadN = parseUnreadCount(conv.unread);
          const touched: SupportConversation = {
            ...conv,
            preview: mapped.body || conv.preview,
            lastMessageType: mapped.messageType ?? conv.lastMessageType,
            lastMessageAt: mapped.waTimestamp ?? conv.lastMessageAt,
            lastMessageStatus: mapped.status ?? conv.lastMessageStatus,
            timestamp: mapped.time || conv.timestamp,
            unread: inbound ? String(unreadN + 1) : conv.unread,
          };
          conversations = [
            touched,
            ...prev.conversations.filter((c) => c.id !== conv.id),
          ];
        } else if (
          event.eventType === "UPDATE" &&
          conv &&
          conv.lastMessageAt &&
          mapped.waTimestamp &&
          mapped.waTimestamp >= conv.lastMessageAt
        ) {
          conversations = prev.conversations.map((c) =>
            c.id === conv.id
              ? {
                  ...c,
                  lastMessageStatus: mapped.status ?? c.lastMessageStatus,
                }
              : c,
          );
        }

        return {
          ...prev,
          conversations,
          messagesById: {
            ...prev.messagesById,
            [row.conversation_id]: nextMsgs,
          },
        };
      });
      void refreshConversations();
    });

    function unlock() {
      unlockWhatsappInboundChime();
    }
    window.addEventListener("pointerdown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      unsub();
    };
  }, [enabled, refreshConversations, agentName, viewRef]);

  const replaceConversationMessages = useCallback(
    (
      conversationId: string,
      messages: SupportMessage[],
      nextCursor: string | null,
    ) => {
      setLive((prev) => ({
        ...prev,
        messagesById: {
          ...prev.messagesById,
          [conversationId]: mergeSupportMessages(
            messages,
            prev.messagesById[conversationId] ?? [],
          ),
        },
        cursorsById: {
          ...prev.cursorsById,
          [conversationId]: nextCursor,
        },
      }));
    },
    [],
  );

  const state = enabled ? live : initial;

  useEffect(() => {
    onUnreadRef.current?.(
      enabled ? unreadTotalFromConversations(state.conversations) : 0,
    );
  }, [enabled, state.conversations]);

  return {
    ...state,
    filterLoading: enabled ? filterLoading : false,
    refreshConversations,
    prependPage,
    replaceConversationMessages,
    patchDetails,
    patchConversationStatus,
    touchConversation,
  };
}

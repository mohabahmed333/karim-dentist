"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type {
  WhatsappConversation,
  WhatsappMessage,
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
  SupportDetails,
  SupportMessage,
} from "./supportDummyData";
import type { SupportConversation } from "./supportDummyData";

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
) {
  const instanceId = useId().replace(/:/g, "");
  const [live, setLive] = useState(initial);
  const [filterLoading, setFilterLoading] = useState(false);
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
  }, [initial]);

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
    const channel = supabase
      .channel(`whatsapp-inbox-live-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as WhatsappMessage | null;
          if (!row?.conversation_id) {
            void refreshConversations();
            return;
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
            if (payload.eventType === "DELETE") {
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

            const isLatest =
              payload.eventType !== "DELETE" &&
              nextMsgs[nextMsgs.length - 1]?.id === mapped.id;
            let conversations = prev.conversations;
            if (isLatest && conv) {
              const touched: SupportConversation = {
                ...conv,
                preview: mapped.body || conv.preview,
                lastMessageType: mapped.messageType ?? conv.lastMessageType,
                lastMessageAt: mapped.waTimestamp ?? conv.lastMessageAt,
                lastMessageStatus: mapped.status ?? conv.lastMessageStatus,
                timestamp: mapped.time || conv.timestamp,
              };
              conversations = [
                touched,
                ...prev.conversations.filter((c) => c.id !== conv.id),
              ];
            } else if (
              payload.eventType === "UPDATE" &&
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
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => {
          void refreshConversations();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_notes" },
        () => {
          void refreshConversations();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, refreshConversations, agentName, instanceId]);

  const replaceConversationMessages = useCallback(
    (
      conversationId: string,
      messages: SupportMessage[],
      nextCursor: string | null,
    ) => {
      setLive((prev) => ({
        ...prev,
        messagesById: { ...prev.messagesById, [conversationId]: messages },
        cursorsById: {
          ...prev.cursorsById,
          [conversationId]: nextCursor,
        },
      }));
    },
    [],
  );

  const state = enabled ? live : initial;
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

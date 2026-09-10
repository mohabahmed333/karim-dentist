"use client";

import { useEffect, useState } from "react";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import { createClient } from "@/lib/supabase/client";
import { listConversations } from "@/services/whatsapp/queries";
import { subscribeWhatsappLive } from "@/features/admin/lib/whatsappLiveClient";
import {
  patchConversationsFromMessage,
  preferLiveConversations,
  upsertConversationRow,
} from "@/features/admin/lib/whatsappLiveApply";

const POLL_MS = 3000;
const POLL_LIMIT = 40;

export function useWhatsappConversationsLive(
  initial: WhatsappConversation[],
  live = true,
): WhatsappConversation[] {
  const [rows, setRows] = useState(initial);

  useEffect(() => {
    setRows((prev) => preferLiveConversations(initial, prev));
  }, [initial]);

  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    let cancelled = false;
    async function pull() {
      try {
        const next = await listConversations(supabase, {
          status: "open",
          sort: "newest",
          limit: POLL_LIMIT,
        });
        if (!cancelled) setRows(next);
      } catch {
        /* keep last rows */
      }
    }
    void pull();
    const pollId = window.setInterval(pull, POLL_MS);
    function onVis() {
      if (document.visibilityState === "visible") void pull();
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", pull);
    const unsub = subscribeWhatsappLive((event) => {
      if (event.table === "whatsapp_conversations") {
        if (event.eventType === "DELETE" && event.row?.id) {
          const deletedId = event.row.id;
          setRows((prev) => prev.filter((row) => row.id !== deletedId));
          return;
        }
        if (event.row) {
          const row = event.row;
          setRows((prev) => upsertConversationRow(prev, row));
        }
        return;
      }
      if (event.row && event.eventType !== "DELETE") {
        const message = event.row;
        setRows((prev) => patchConversationsFromMessage(prev, message));
      }
    });
    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", pull);
      unsub();
    };
  }, [live]);

  return rows;
}

"use client";

import { useCallback, useRef } from "react";
import type { QuickReplyValues } from "@/services/whatsapp/quickReplyFields";

/** Long enough to avoid refetching on every reply, short enough to pick up a booking made mid-chat. */
const CACHE_MS = 60_000;

/**
 * Field values for the open conversation, per language.
 *
 * A failed lookup returns no values: every field then stays unfilled and the
 * composer blocks the send. Guessing is never an option for a patient message.
 */
export function useQuickReplyValues(conversationId: string | undefined) {
  const cache = useRef(new Map<string, { at: number; values: QuickReplyValues }>());

  return useCallback(
    async (lang: "ar" | "en"): Promise<QuickReplyValues> => {
      if (!conversationId) return {};
      const key = `${conversationId}:${lang}`;
      const hit = cache.current.get(key);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.values;
      try {
        const res = await fetch(
          `/api/v1/whatsapp/canned-replies/context?conversationId=${encodeURIComponent(conversationId)}&lang=${lang}`,
        );
        if (!res.ok) return {};
        const data = (await res.json()) as { values?: QuickReplyValues };
        const values = data.values ?? {};
        cache.current.set(key, { at: Date.now(), values });
        return values;
      } catch {
        return {};
      }
    },
    [conversationId],
  );
}

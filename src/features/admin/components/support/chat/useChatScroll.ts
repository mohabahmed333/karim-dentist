"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  onNearTop: () => void;
  enabled?: boolean;
  loadingMore?: boolean;
};

export function useChatScroll(
  messageCount: number,
  { onNearTop, enabled = true, loadingMore = false }: Options,
) {
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const prevHeightRef = useRef(0);
  const prevLoadingRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (loadingMore && !prevLoadingRef.current && listRef.current) {
      prevHeightRef.current = listRef.current.scrollHeight;
      loadingMoreRef.current = true;
    }
    if (!loadingMore && prevLoadingRef.current) {
      const el = listRef.current;
      if (el) {
        const delta = el.scrollHeight - prevHeightRef.current;
        if (delta > 0) el.scrollTop += delta;
      }
      loadingMoreRef.current = false;
    }
    prevLoadingRef.current = loadingMore;
  }, [loadingMore]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !enabled) return;

    function onScroll() {
      if (!el) return;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      nearBottomRef.current = distance < 80;
      if (el.scrollTop < 100 && !loadingMoreRef.current) {
        onNearTop();
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [enabled, onNearTop]);

  useEffect(() => {
    if (!enabled || loadingMoreRef.current) return;
    if (nearBottomRef.current) scrollToBottom();
  }, [enabled, messageCount, scrollToBottom]);

  return {
    listRef,
    scrollToBottom,
    isNearBottom: () => nearBottomRef.current,
  };
}

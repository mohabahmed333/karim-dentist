"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  INDEX_PAGE_SIZE,
  hasMoreItems,
  initialVisibleCount,
  nextVisibleCount,
  visibleItems,
} from "../lib/infiniteBatch";

type Options = {
  pageSize?: number;
  enabled?: boolean;
};

export function useInfiniteBatch<T>(items: T[], options: Options = {}) {
  const pageSize = options.pageSize ?? INDEX_PAGE_SIZE;
  const enabled = options.enabled ?? true;
  const total = items.length;
  const [visibleCount, setVisibleCount] = useState(() =>
    initialVisibleCount(total, pageSize),
  );

  useEffect(() => {
    setVisibleCount(initialVisibleCount(total, pageSize));
  }, [total, pageSize]);

  const hasMore = hasMoreItems(visibleCount, total, enabled);
  const visible = visibleItems(items, visibleCount, enabled);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => nextVisibleCount(current, total, pageSize));
  }, [pageSize, total]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  return { visible, hasMore, loadMore, sentinelRef };
}

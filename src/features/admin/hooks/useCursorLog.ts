"use client";

import { useEffect, useState } from "react";

export type CursorPage<T> = { rows: T[]; nextCursor: string | null };

type LoadedPage<T> = { key: string; rows: T[]; nextCursor: string | null };

/**
 * Shared "cursor-paginated, filterable log" state machine behind both the
 * AI actions log and the system action log: fetch page one whenever the
 * filter changes, offer `loadMore` for subsequent pages, and treat a page
 * whose `key` doesn't match the current filter as still loading — this is
 * what keeps a synchronous setState out of the effect body (calling
 * setState directly inside an effect body triggers cascading renders the
 * react-hooks/set-state-in-effect lint rule flags).
 */
export function useCursorLog<T>(
  filterKey: string,
  fetchPage: (cursor: string | null) => Promise<CursorPage<T>>,
  onError: () => void,
) {
  const [page, setPage] = useState<LoadedPage<T> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchPage(null)
      .then((result) => {
        if (alive) setPage({ key: filterKey, rows: result.rows, nextCursor: result.nextCursor });
      })
      .catch(() => {
        if (alive) {
          setPage({ key: filterKey, rows: [], nextCursor: null });
          onError();
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stabilize by filterKey
  }, [filterKey]);

  const rows = page && page.key === filterKey ? page.rows : null;
  const nextCursor = page && page.key === filterKey ? page.nextCursor : null;

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await fetchPage(nextCursor);
      setPage((prev) =>
        prev && prev.key === filterKey
          ? { key: filterKey, rows: [...prev.rows, ...result.rows], nextCursor: result.nextCursor }
          : prev,
      );
    } catch {
      onError();
    } finally {
      setLoadingMore(false);
    }
  }

  return { rows, nextCursor, loadingMore, loadMore };
}

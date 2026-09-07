"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioData } from "@/services/portfolio";
import { cloneData } from "./dataHelpers";
import {
  createHistory,
  historyFlags,
  pushHistory,
  redoHistory,
  resetHistory,
  undoHistory,
  type HistoryEntry,
  type HistoryState,
} from "./editHistory";
import type { SaveStatus } from "../types";

type Options = {
  data: PortfolioData;
  status: SaveStatus;
  getPendingKeys: () => string[];
  replacePending: (keys: string[]) => void;
  setData: (data: PortfolioData) => void;
  setStatus: (status: SaveStatus) => void;
};

const DEBOUNCE_MS = 400;

export function useEditHistory({
  data,
  status,
  getPendingKeys,
  replacePending,
  setData,
  setStatus,
}: Options) {
  const [state, setState] = useState<HistoryState>(() => createHistory(data));
  const skipRecordRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyEntry = useCallback(
    (entry: HistoryEntry) => {
      skipRecordRef.current += 1;
      setData(cloneData(entry.data));
      replacePending(entry.pendingKeys);
      setStatus(entry.pendingKeys.length > 0 ? "unsaved" : "saved");
    },
    [replacePending, setData, setStatus],
  );

  const reset = useCallback((baseline: PortfolioData) => {
    skipRecordRef.current += 1;
    setState(resetHistory(baseline));
  }, []);

  useEffect(() => {
    if (skipRecordRef.current > 0) {
      skipRecordRef.current -= 1;
      return;
    }
    if (status !== "unsaved" && status !== "error") return;

    const timer = window.setTimeout(() => {
      if (skipRecordRef.current > 0) return;
      const entry: HistoryEntry = {
        data: cloneData(data),
        pendingKeys: getPendingKeys(),
      };
      setState((current) => pushHistory(current, entry));
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [data, status, getPendingKeys]);

  const undo = useCallback(() => {
    const result = undoHistory(stateRef.current);
    if (!result) return;
    setState(result.state);
    applyEntry(result.entry);
  }, [applyEntry]);

  const redo = useCallback(() => {
    const result = redoHistory(stateRef.current);
    if (!result) return;
    setState(result.state);
    applyEntry(result.entry);
  }, [applyEntry]);

  const flags = historyFlags(state);

  return {
    undo,
    redo,
    reset,
    canUndo: flags.canUndo,
    canRedo: flags.canRedo,
  };
}

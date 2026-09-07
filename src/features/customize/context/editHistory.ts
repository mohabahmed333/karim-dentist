import type { PortfolioData } from "@/services/portfolio";

export type HistoryEntry = {
  data: PortfolioData;
  pendingKeys: string[];
};

export type HistoryState = {
  entries: HistoryEntry[];
  index: number;
};

/** Baseline (last save) + up to 10 unsaved edit steps. */
const MAX_ENTRIES = 11;

function clone(data: PortfolioData): PortfolioData {
  return structuredClone(data);
}

export function createHistory(data: PortfolioData): HistoryState {
  return {
    entries: [{ data: clone(data), pendingKeys: [] }],
    index: 0,
  };
}

export function resetHistory(data: PortfolioData): HistoryState {
  return createHistory(data);
}

function sameEntry(a: HistoryEntry, b: HistoryEntry) {
  if (a.pendingKeys.length !== b.pendingKeys.length) return false;
  if (a.pendingKeys.some((key, i) => key !== b.pendingKeys[i])) return false;
  return JSON.stringify(a.data) === JSON.stringify(b.data);
}

/** Truncate redo branch and append a new step (no-op if identical to current). */
export function pushHistory(
  state: HistoryState,
  entry: HistoryEntry,
): HistoryState {
  const current = state.entries[state.index];
  if (current && sameEntry(current, entry)) return state;
  const kept = state.entries.slice(0, state.index + 1);
  const nextEntries = [...kept, entry].slice(-MAX_ENTRIES);
  return {
    entries: nextEntries,
    index: nextEntries.length - 1,
  };
}

export function undoHistory(
  state: HistoryState,
): { state: HistoryState; entry: HistoryEntry } | null {
  if (state.index <= 0) return null;
  const index = state.index - 1;
  const entry = state.entries[index];
  if (!entry) return null;
  return { state: { ...state, index }, entry };
}

export function redoHistory(
  state: HistoryState,
): { state: HistoryState; entry: HistoryEntry } | null {
  if (state.index >= state.entries.length - 1) return null;
  const index = state.index + 1;
  const entry = state.entries[index];
  if (!entry) return null;
  return { state: { ...state, index }, entry };
}

export function historyFlags(state: HistoryState) {
  return {
    canUndo: state.index > 0,
    canRedo: state.index < state.entries.length - 1,
  };
}

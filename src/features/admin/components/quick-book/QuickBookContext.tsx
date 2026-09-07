"use client";

import { createContext, useContext } from "react";
import type { QuickBookPrefill } from "./quickBookTypes";

export type QuickBookApi = {
  openQuickBook: (prefill?: QuickBookPrefill) => void;
};

export const QuickBookContext = createContext<QuickBookApi | null>(null);

export function useQuickBook(): QuickBookApi {
  const ctx = useContext(QuickBookContext);
  if (!ctx) {
    throw new Error("useQuickBook must be used within QuickBookProvider");
  }
  return ctx;
}

/** Safe for optional chrome that may render outside the provider. */
export function useOptionalQuickBook(): QuickBookApi | null {
  return useContext(QuickBookContext);
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useCustomizeActions,
  useCustomizeStatus,
} from "../context/CustomizeContext";
import { navigateLeave } from "../lib/leaveNavigation";
import { UnsavedLeaveModal } from "./UnsavedLeaveModal";
import { useUnsavedLeaveEffects } from "./useUnsavedLeaveEffects";

type LeaveContextValue = {
  requestLeave: (href: string) => void;
};

const LeaveContext = createContext<LeaveContextValue | null>(null);

export function useLeaveGuard(): LeaveContextValue {
  const ctx = useContext(LeaveContext);
  if (!ctx) {
    throw new Error("useLeaveGuard must be used within UnsavedChangesGuard");
  }
  return ctx;
}

/** Custom leave warning + native refresh/close guard when edits are unsaved. */
export function UnsavedChangesGuard({
  children,
}: {
  children?: ReactNode;
}) {
  const status = useCustomizeStatus();
  const { saveNow, discard } = useCustomizeActions();
  const router = useRouter();
  const dirty = status === "unsaved" || status === "error";
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestLeave = useCallback(
    (href: string) => {
      if (!dirty) {
        navigateLeave(router, href);
        return;
      }
      setPendingHref(href);
    },
    [dirty, router],
  );

  const value = useMemo(() => ({ requestLeave }), [requestLeave]);
  useUnsavedLeaveEffects(dirty, requestLeave);

  const close = () => {
    if (!busy) setPendingHref(null);
  };

  return (
    <LeaveContext.Provider value={value}>
      {children}
      {pendingHref && typeof document !== "undefined"
        ? createPortal(
            <UnsavedLeaveModal
              busy={busy}
              onStay={close}
              onDiscard={() => {
                discard();
                navigateLeave(router, pendingHref);
                setPendingHref(null);
              }}
              onSave={async () => {
                setBusy(true);
                try {
                  const ok = await saveNow();
                  if (ok) {
                    navigateLeave(router, pendingHref);
                    setPendingHref(null);
                  }
                } finally {
                  setBusy(false);
                }
              }}
            />,
            document.body,
          )
        : null}
    </LeaveContext.Provider>
  );
}

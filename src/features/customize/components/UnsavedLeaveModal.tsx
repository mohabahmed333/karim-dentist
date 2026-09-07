"use client";

import { Button } from "@/components/ui/button";

type Props = {
  busy: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => Promise<void>;
};

export function UnsavedLeaveModal({
  busy,
  onStay,
  onDiscard,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/45"
        disabled={busy}
        onClick={onStay}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        className="relative z-[1] w-full max-w-md rounded-xl border border-[#e5e5e5] bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
      >
        <h2
          id="unsaved-title"
          className="text-base font-semibold text-[#1a1a1a]"
        >
          Unsaved changes
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">
          You have unsaved edits. If you leave now, all changes will be
          discarded. Save before leaving to keep them.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-8"
            disabled={busy}
            onClick={onStay}
          >
            Stay
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-8"
            disabled={busy}
            onClick={onDiscard}
          >
            Discard & leave
          </Button>
          <Button
            type="button"
            className="h-8 bg-[#1a1a1a] text-white hover:bg-[#333]"
            disabled={busy}
            onClick={() => void onSave()}
          >
            {busy ? "Saving…" : "Save & leave"}
          </Button>
        </div>
      </div>
    </div>
  );
}

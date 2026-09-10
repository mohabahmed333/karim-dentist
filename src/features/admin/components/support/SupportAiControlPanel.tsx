"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import type { WhatsappAiState } from "@/services/whatsapp_ai/types";

type Props = { conversationId: string };

const PAUSE_OPTIONS: { minutes: number; key: AdminMessageKey }[] = [
  { minutes: 15, key: "admin.frontDesk.aiControlPause15m" },
  { minutes: 60, key: "admin.frontDesk.aiControlPause1h" },
  { minutes: 240, key: "admin.frontDesk.aiControlPause4h" },
];

async function fetchState(conversationId: string): Promise<WhatsappAiState | null> {
  const res = await fetch(
    `/api/v1/whatsapp/ai/toggle?conversationId=${encodeURIComponent(conversationId)}`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { state?: WhatsappAiState | null };
  return data.state ?? null;
}

export function SupportAiControlPanel({ conversationId }: Props) {
  const t = useTranslations();
  const [state, setState] = useState<WhatsappAiState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchState(conversationId)
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function patch(body: { enabled?: boolean; pauseMinutes?: number }) {
    setPending(true);
    try {
      const res = await fetch("/api/v1/whatsapp/ai/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, ...body }),
      });
      if (!res.ok) throw new Error("failed");
      setState(await fetchState(conversationId));
    } catch {
      toast.error(t("admin.frontDesk.aiControlError"));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <p className="px-1 py-1 text-xs text-[#9CA3AF]">
        {t("admin.frontDesk.aiControlLoading")}
      </p>
    );
  }

  const enabled = state?.autoreply_enabled ?? true;
  const pausedUntil = state?.paused_until ? new Date(state.paused_until) : null;
  const isPaused = pausedUntil ? pausedUntil.getTime() > Date.now() : false;

  return (
    <div className="space-y-2.5 px-1 py-1">
      <label className="flex items-center justify-between gap-2 text-xs font-medium text-[#374151]">
        {t("admin.frontDesk.aiControlEnabled")}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={() => void patch({ enabled: !enabled })}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50",
            enabled ? "bg-[#111827]" : "bg-[#D1D5DB]",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform rtl:end-0.5",
              enabled ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0.5 rtl:translate-x-0",
            )}
          />
        </button>
      </label>

      {isPaused && pausedUntil ? (
        <p className="text-[11px] text-[#B45309]">
          {t("admin.frontDesk.aiControlPausedUntil")}{" "}
          {pausedUntil.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {PAUSE_OPTIONS.map(({ minutes, key }) => (
          <button
            key={minutes}
            type="button"
            disabled={pending || !enabled}
            onClick={() => void patch({ pauseMinutes: minutes })}
            className="rounded-md border border-[#E5E7EB] px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-50"
          >
            {t(key)}
          </button>
        ))}
        {isPaused ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => void patch({ pauseMinutes: 0 })}
            className="rounded-md border border-[#E5E7EB] px-2 py-1 text-[11px] font-medium text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-50"
          >
            {t("admin.frontDesk.aiControlResume")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

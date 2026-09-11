"use client";

import { AdminSkeleton } from "./AdminSkeleton";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WhatsappAiSettings } from "@/services/whatsapp_ai/types";

const SELECT_CLASS =
  "h-9 w-full cursor-pointer rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 text-sm text-[var(--admin-text,#1a1a1a)] outline-none";

type Mode = WhatsappAiSettings["mode"];

const MODE_HINTS: Record<Mode, string> = {
  off: "The assistant never reads or replies to messages.",
  draft_only:
    "The assistant drafts replies for staff to review and send — nothing goes to patients automatically.",
  auto: "The assistant sends its own replies directly to patients, within the rate limits below.",
};

const MODE_BADGE: Record<Mode, string> = {
  off: "border-[var(--admin-border)] text-[var(--admin-muted)]",
  draft_only: "border-[#93C5FD] bg-[#EFF6FF] text-[#1D4ED8]",
  auto: "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]",
};

async function loadSettings(): Promise<WhatsappAiSettings | null> {
  const res = await fetch("/api/v1/whatsapp/ai/settings");
  if (!res.ok) return null;
  const data = (await res.json()) as { settings?: WhatsappAiSettings };
  return data.settings ?? null;
}

export function WhatsappAiSettingsForm() {
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [settings, setSettings] = useState<WhatsappAiSettings | null>(null);

  useEffect(() => {
    let alive = true;
    void loadSettings()
      .then((next) => {
        if (alive) setSettings(next);
      })
      .catch(() => {
        if (alive) toast.error("Failed to load AI settings");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    if (!settings) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/whatsapp/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: settings.mode,
          max_replies_per_conversation_per_hour:
            settings.max_replies_per_conversation_per_hour,
          max_replies_global_per_hour: settings.max_replies_global_per_hour,
          human_handoff_minutes: settings.human_handoff_minutes,
          allow_booking_writes: settings.allow_booking_writes,
          ack_media_enabled: settings.ack_media_enabled,
        }),
      });
      const data = (await res.json()) as {
        settings?: WhatsappAiSettings;
        error?: string;
      };
      if (!res.ok || !data.settings) throw new Error(data.error ?? "Save failed");
      setSettings(data.settings);
      toast.success(t("admin.pages.whatsappAi.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-5">
        <span className="sr-only">Loading AI assistant settings…</span>
        <div className="space-y-2">
          <AdminSkeleton className="h-3.5 w-12" />
          <AdminSkeleton className="h-9 w-full rounded-lg" />
          <AdminSkeleton className="h-6 w-72 rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {["w-52", "w-56", "w-48"].map((w) => (
            <div key={w} className="space-y-1.5">
              <AdminSkeleton className={`h-3.5 ${w}`} />
              <AdminSkeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
        {[0, 1].map((row) => (
          <div
            key={row}
            className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] px-3 py-2.5"
          >
            <AdminSkeleton className="h-3.5 w-56" />
            <AdminSkeleton className="size-4 rounded" />
          </div>
        ))}
        <AdminSkeleton className="h-9 w-24 rounded-md" />
      </div>
    );
  }

  // A failed request used to leave the loading state on screen forever.
  if (!settings) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">
        Could not load the AI assistant settings. Reload the page to try again.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Mode</Label>
        <select
          className={SELECT_CLASS}
          value={settings.mode}
          onChange={(e) =>
            setSettings({ ...settings, mode: e.target.value as Mode })
          }
        >
          <option value="off">Off</option>
          <option value="draft_only">Draft only</option>
          <option value="auto">Auto-send</option>
        </select>
        <p
          className={`inline-flex w-fit rounded-md border px-2 py-1 text-[11px] font-medium ${MODE_BADGE[settings.mode]}`}
        >
          {MODE_HINTS[settings.mode]}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <Label>Max AI replies / conversation / hour</Label>
          <Input
            type="number"
            min={0}
            max={60}
            value={settings.max_replies_per_conversation_per_hour}
            onChange={(e) =>
              setSettings({
                ...settings,
                max_replies_per_conversation_per_hour: Number(e.target.value),
              })
            }
          />
        </label>
        <label className="space-y-1.5">
          <Label>Max AI replies / hour (all patients)</Label>
          <Input
            type="number"
            min={0}
            max={5000}
            value={settings.max_replies_global_per_hour}
            onChange={(e) =>
              setSettings({
                ...settings,
                max_replies_global_per_hour: Number(e.target.value),
              })
            }
          />
        </label>
        <label className="space-y-1.5">
          <Label>Human handoff window (minutes)</Label>
          <Input
            type="number"
            min={0}
            max={1440}
            value={settings.human_handoff_minutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                human_handoff_minutes: Number(e.target.value),
              })
            }
          />
          <p className="text-[11px] text-[var(--admin-muted)]">
            How long the bot stays quiet on a thread after a staff member
            sends a message.
          </p>
        </label>
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5 text-sm">
          <span>
            Allow the assistant to write bookings
            <span className="block text-[11px] text-[var(--admin-muted)]">
              Lets it create/modify appointments on its own, not just answer
              questions.
            </span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={settings.allow_booking_writes}
            onChange={(e) =>
              setSettings({ ...settings, allow_booking_writes: e.target.checked })
            }
          />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5 text-sm">
          <span>
            Auto-acknowledge media
            <span className="block text-[11px] text-[var(--admin-muted)]">
              Sends a short &ldquo;got it, staff will review&rdquo; reply when
              a patient sends a photo/document.
            </span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={settings.ack_media_enabled}
            onChange={(e) =>
              setSettings({ ...settings, ack_media_enabled: e.target.checked })
            }
          />
        </label>
      </div>

      <Button type="button" disabled={pending} onClick={() => void onSave()}>
        {pending ? t("admin.saving") : t("admin.saveChanges")}
      </Button>

      <p className="text-[11px] text-[var(--admin-muted)]">
        Per-patient pause/off is available from each conversation&apos;s
        details panel in Support.
      </p>
    </div>
  );
}

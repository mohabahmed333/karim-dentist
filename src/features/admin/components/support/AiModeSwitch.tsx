"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Mode = "off" | "draft_only" | "auto";

type Settings = {
  mode: Mode;
  allow_booking_writes: boolean;
  full_conversation: boolean;
};

const MODES: { value: Mode; labelKey: string; hintKey: string }[] = [
  { value: "off", labelKey: "admin.frontDesk.aiModeOff", hintKey: "admin.frontDesk.aiModeOffHint" },
  { value: "draft_only", labelKey: "admin.frontDesk.aiModeDraft", hintKey: "admin.frontDesk.aiModeDraftHint" },
  { value: "auto", labelKey: "admin.frontDesk.aiModeAuto", hintKey: "admin.frontDesk.aiModeAutoHint" },
];

/**
 * Off / Draft / Auto for the WhatsApp assistant, plus the separate booking
 * switch.
 *
 * These are two decisions, not one: "may it reply" and "may it change the
 * calendar" carry very different risk, so they get separate controls rather
 * than a single four-step dial.
 */
export function AiModeSwitch({ compact = false }: { compact?: boolean }) {
  const t = useTranslations();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/whatsapp/ai/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.settings) setSettings(d.settings as Settings);
      })
      .catch(() => {
        /* the switch simply stays hidden if settings cannot be read */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(next: Partial<Settings>) {
    if (!settings) return;
    const previous = settings;
    setSettings({ ...settings, ...next });
    setBusy(true);
    try {
      const res = await fetch("/api/v1/whatsapp/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("failed");
      const body = (await res.json()) as { settings: Settings };
      setSettings(body.settings);
      toast.success(t("admin.frontDesk.aiModeSaved"));
    } catch {
      setSettings(previous);
      toast.error(t("admin.frontDesk.aiModeFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (!settings) return null;

  const active = MODES.find((m) => m.value === settings.mode) ?? MODES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
          settings.mode === "auto" && "border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]",
          settings.mode === "draft_only" && "border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]",
          settings.mode === "off" && "border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]",
        )}
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" aria-hidden />
        ) : (
          <Bot className="size-3" aria-hidden />
        )}
        {t(active.labelKey as never)}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("admin.frontDesk.aiModeClose")}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 z-20 mt-1.5 w-64 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg",
              compact && "w-56",
            )}
          >
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                disabled={busy}
                onClick={() => {
                  void patch({ mode: m.value });
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-[#F9FAFB]",
                  settings.mode === m.value && "bg-[#F3F4F6]",
                )}
              >
                <span className="text-[12px] font-medium text-[#111827]">
                  {t(m.labelKey as never)}
                </span>
                <span className="text-[11px] leading-snug text-[#6B7280]">
                  {t(m.hintKey as never)}
                </span>
              </button>
            ))}

            <div className="mt-1 border-t border-[#F3F4F6] pt-1.5">
              <label className="flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 hover:bg-[#F9FAFB]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={settings.allow_booking_writes}
                  disabled={busy || settings.mode === "off"}
                  onChange={(e) =>
                    void patch({ allow_booking_writes: e.target.checked })
                  }
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-[#111827]">
                    {t("admin.frontDesk.aiAllowBooking")}
                  </span>
                  <span className="text-[11px] leading-snug text-[#6B7280]">
                    {t("admin.frontDesk.aiAllowBookingHint")}
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 hover:bg-[#F9FAFB]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={settings.full_conversation}
                  disabled={busy || settings.mode === "off"}
                  onChange={(e) =>
                    void patch({ full_conversation: e.target.checked })
                  }
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-[#111827]">
                    {t("admin.frontDesk.aiFullConversation")}
                  </span>
                  <span className="text-[11px] leading-snug text-[#6B7280]">
                    {t("admin.frontDesk.aiFullConversationHint")}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

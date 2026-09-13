"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { DepositSettings } from "@/services/deposits/store";
import { AdminSkeleton } from "./AdminSkeleton";
import { HelpTip } from "./HelpTip";
import {
  SettingsHintBanner,
  SettingsSaveRow,
  SettingsSectionGroup,
} from "./SettingsSectionGroup";

/** Fields whose value is a number the server range-checks. */
type NumberField =
  | "amount_egp"
  | "hold_minutes"
  | "min_confidence"
  | "amount_tolerance_egp"
  | "receipt_max_age_hours";

async function loadSettings(): Promise<DepositSettings | null> {
  const res = await fetch("/api/v1/deposits/settings");
  if (!res.ok) return null;
  const data = (await res.json()) as { settings?: DepositSettings | null };
  return data.settings ?? null;
}

export function DepositSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [settings, setSettings] = useState<DepositSettings | null>(null);
  const [names, setNames] = useState("");

  useEffect(() => {
    let alive = true;
    void loadSettings()
      .then((next) => {
        if (!alive) return;
        setSettings(next);
        setNames((next?.recipient_names ?? []).join(", "));
      })
      .catch(() => {
        if (alive) toast.error("Failed to load deposit settings");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function set<K extends keyof DepositSettings>(key: K, value: DepositSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  const setNumber = (key: NumberField, raw: string) => {
    const parsed = Number(raw);
    set(key, (Number.isFinite(parsed) ? parsed : 0) as DepositSettings[NumberField]);
  };

  async function onSave() {
    if (!settings) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/deposits/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          amount_egp: Number(settings.amount_egp),
          instapay_handle: settings.instapay_handle,
          wallet_number: settings.wallet_number,
          recipient_names: names
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
          hold_minutes: settings.hold_minutes,
          auto_confirm: settings.auto_confirm,
          ocr_cross_check: settings.ocr_cross_check,
          min_confidence: Number(settings.min_confidence),
          amount_tolerance_egp: Number(settings.amount_tolerance_egp),
          receipt_max_age_hours: settings.receipt_max_age_hours,
        }),
      });
      const body = (await res.json()) as { settings?: DepositSettings; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Save failed");
      setSettings(body.settings ?? settings);
      toast.success("Deposit settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <AdminSkeleton className="h-72 w-full rounded-lg" />;
  if (!settings) {
    return (
      <p className="text-sm text-[var(--admin-muted)]">
        Deposit settings are unavailable — the database may not have the deposit tables yet. Run{" "}
        <code>supabase db push --linked</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsHintBanner>
        A slot booked over WhatsApp is held, not confirmed, until the patient sends a receipt for
        the deposit. Unpaid holds are released automatically and offered to the waitlist.
      </SettingsHintBanner>

      <SettingsSectionGroup title="Deposit">
        <div className="space-y-4">
          <label className="flex items-start gap-2.5">
            <Checkbox
              checked={settings.enabled}
              onCheckedChange={(next) => set("enabled", next === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              Ask for a deposit on WhatsApp bookings
              <span className="block text-xs text-[var(--admin-muted)]">
                Staff and website bookings are unaffected.
              </span>
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-amount">Deposit amount (EGP)</Label>
              <Input
                id="deposit-amount"
                type="number"
                min={0}
                value={String(settings.amount_egp)}
                onChange={(e) => setNumber("amount_egp", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-hold">Hold the slot for (minutes)</Label>
              <Input
                id="deposit-hold"
                type="number"
                min={5}
                max={240}
                value={String(settings.hold_minutes)}
                onChange={(e) => setNumber("hold_minutes", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-instapay">InstaPay handle</Label>
              <Input
                id="deposit-instapay"
                value={settings.instapay_handle}
                placeholder="clinic@instapay"
                onChange={(e) => set("instapay_handle", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-wallet">Wallet number</Label>
              <Input
                id="deposit-wallet"
                value={settings.wallet_number}
                placeholder="01001234567"
                onChange={(e) => set("wallet_number", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-names" className="flex items-center gap-1.5">
              Account name as it prints on a receipt
              <HelpTip text="Without this, every receipt fails the check on who was paid and waits for staff — the feature looks like it is working while collecting nothing automatically. Add the Arabic spelling too if that is how it appears. Separate several with commas." />
            </Label>
            <Input
              id="deposit-names"
              value={names}
              placeholder="The Dental Lounge, دينتال لاونج"
              onChange={(e) => setNames(e.target.value)}
            />
          </div>
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup title="Confirmation">
        <label className="flex items-start gap-2.5">
          <Checkbox
            checked={settings.auto_confirm}
            onCheckedChange={(next) => set("auto_confirm", next === true)}
            className="mt-0.5"
          />
          <span className="text-sm">
            Confirm clean receipts automatically
            <span className="block text-xs text-[var(--admin-muted)]">
              Leave this off until the deposits queue shows the readings are right. A screenshot is a
              picture of a claim, not proof of payment: every check here raises the effort of a forgery
              but none makes one impossible, and the deposit amount is the cap on what one costs you.
            </span>
          </span>
        </label>

        <label className="mt-3 flex items-start gap-2.5">
          <Checkbox
            checked={settings.ocr_cross_check}
            onCheckedChange={(next) => set("ocr_cross_check", next === true)}
            className="mt-0.5"
            disabled={!settings.auto_confirm}
          />
          <span className="text-sm">
            Read every receipt a second time before confirming it
            <span className="block text-xs text-[var(--admin-muted)]">
              An offline reader checks that the amount and reference the AI reported are really
              printed on the image, and sends it here instead if it cannot find them. This catches
              the AI inventing a number. It does <strong>not</strong> detect a forged screenshot —
              a forgery reads consistently to both. Adds a few seconds, and only runs when a receipt
              is about to be confirmed automatically.
            </span>
          </span>
        </label>

        <details className="mt-3 rounded-lg border border-[var(--admin-border)] px-3 py-2">
          <summary className="cursor-pointer text-sm">Reading receipts — fine tuning</summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-confidence">Minimum confidence</Label>
              <Input
                id="deposit-confidence"
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={String(settings.min_confidence)}
                onChange={(e) => setNumber("min_confidence", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-tolerance">Amount tolerance (EGP)</Label>
              <Input
                id="deposit-tolerance"
                type="number"
                min={0}
                value={String(settings.amount_tolerance_egp)}
                onChange={(e) => setNumber("amount_tolerance_egp", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-age">Receipt no older than (hours)</Label>
              <Input
                id="deposit-age"
                type="number"
                min={1}
                max={720}
                value={String(settings.receipt_max_age_hours)}
                onChange={(e) => setNumber("receipt_max_age_hours", e.target.value)}
              />
            </div>
          </div>
        </details>
      </SettingsSectionGroup>

      <SettingsSaveRow>
        <Button type="button" onClick={() => void onSave()} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </SettingsSaveRow>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { DepositSettings } from "@/services/deposits/store";
import { DepositSettingsSkeleton } from "./DepositSettingsSkeleton";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { HelpTip } from "./HelpTip";
import {
  SettingsHintBanner,
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
  const t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [settings, setSettings] = useState<DepositSettings | null>(null);
  const [names, setNames] = useState("");
  /** Raw text per number field while it is being edited. */
  const [drafts, setDrafts] = useState<Partial<Record<NumberField, string>>>(
    {},
  );
  /** Why the last save was refused — kept on screen, unlike a toast. */
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let alive = true;
    void loadSettings()
      .then((next) => {
        if (!alive) return;
        setSettings(next);
        setNames((next?.recipient_names ?? []).join(", "));
      })
      .catch(() => {
        if (alive) toast.error(t("admin.deposits.loadSettingsFailed"));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function set<K extends keyof DepositSettings>(
    key: K,
    value: DepositSettings[K],
  ) {
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  /**
   * Keep what was typed, including nothing at all.
   *
   * Coercing an emptied field to 0 is how a 200 EGP deposit silently became a
   * zero one: the amount looked cleared, saved as 0, and the server then refused
   * to switch deposits on — leaving a toggle that flicked back off with the
   * complaint pointing at a different field.
   */
  const setNumber = (key: NumberField, raw: string) => {
    setDrafts((current) => ({ ...current, [key]: raw }));
  };

  /** What a number field currently shows: the edit in progress, else the saved value. */
  const numberValue = (key: NumberField) =>
    drafts[key] ?? (settings ? String(settings[key]) : "");

  const numberFor = (key: NumberField, fallback: number) => {
    const raw = drafts[key];
    if (raw === undefined) return Number(settings?.[key] ?? fallback);
    const parsed = Number(raw.trim());
    return raw.trim() !== "" && Number.isFinite(parsed) ? parsed : Number.NaN;
  };

  async function onSave() {
    if (!settings) return;

    const amount = numberFor("amount_egp", 0);
    if (!Number.isFinite(amount)) {
      setProblem(t("admin.deposits.enterAmount"));
      return;
    }
    if (settings.enabled && amount <= 0) {
      setProblem(t("admin.deposits.amountRequired"));
      return;
    }
    if (
      settings.enabled &&
      !settings.instapay_handle.trim() &&
      !settings.wallet_number.trim()
    ) {
      setProblem(t("admin.deposits.payoutRequired"));
      return;
    }

    setProblem("");
    setPending(true);
    try {
      const res = await fetch("/api/v1/deposits/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          amount_egp: numberFor("amount_egp", 0),
          instapay_handle: settings.instapay_handle,
          wallet_number: settings.wallet_number,
          recipient_names: names
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
          hold_minutes: numberFor("hold_minutes", 30),
          auto_confirm: settings.auto_confirm,
          ocr_cross_check: settings.ocr_cross_check,
          min_confidence: numberFor("min_confidence", 0.75),
          amount_tolerance_egp: numberFor("amount_tolerance_egp", 0),
          receipt_max_age_hours: numberFor("receipt_max_age_hours", 48),
        }),
      });
      const body = (await res.json()) as {
        settings?: DepositSettings;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? t("admin.saveFailed"));
      setSettings(body.settings ?? settings);
      setDrafts({});
      toast.success(t("admin.deposits.settingsSaved"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("admin.saveFailed");
      setProblem(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  // The title and the save button need nothing from the server, so they are
  // drawn immediately and only the values are skeletons. Rendering the header
  // after the fetch made the page appear to load twice.
  const header = (
    <LocalizedAdminPageHeader
      titleKey="admin.settings.deposits"
      actions={
        <Button
          type="button"
          onClick={() => void onSave()}
          disabled={pending || !settings}
        >
          {pending ? t("admin.saving") : t("admin.saveChanges")}
        </Button>
      }
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <DepositSettingsSkeleton />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        {header}
        <p className="max-w-3xl text-sm text-[var(--admin-muted)]">
          {t("admin.deposits.unavailable")}{" "}
          <code>supabase db push --linked</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* The primary action sits beside the title, as it does on every editor
          page — reachable without scrolling past the whole form to find it. */}
      {header}

      {/* The header spans the page, so the save action lands on the page's
          right edge rather than the card's. The fields stay in a narrow
          column to stay readable. justify-between flips under dir="rtl". */}
      <div className="max-w-3xl space-y-6">
        <SettingsHintBanner>{t("admin.deposits.hintBanner")}</SettingsHintBanner>

        <SettingsSectionGroup title={t("admin.deposits.sectionDeposit")}>
          <div className="space-y-4">
            <label className="flex items-start gap-2.5">
              <Checkbox
                checked={settings.enabled}
                onCheckedChange={(next) => set("enabled", next === true)}
                className="mt-0.5"
              />
              <span className="text-sm">
                {t("admin.deposits.askForDeposit")}
                <span className="block text-xs text-[var(--admin-muted)]">
                  {t("admin.deposits.askForDepositHint")}
                </span>
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deposit-amount">{t("admin.deposits.amountLabel")}</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  min={0}
                  value={numberValue("amount_egp")}
                  onChange={(e) => setNumber("amount_egp", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit-hold">
                  {t("admin.deposits.holdMinutesLabel")}
                </Label>
                <Input
                  id="deposit-hold"
                  type="number"
                  min={5}
                  max={240}
                  value={numberValue("hold_minutes")}
                  onChange={(e) => setNumber("hold_minutes", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit-instapay">{t("admin.deposits.instapayLabel")}</Label>
                <Input
                  id="deposit-instapay"
                  value={settings.instapay_handle}
                  placeholder="clinic@instapay"
                  onChange={(e) => set("instapay_handle", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit-wallet">{t("admin.deposits.walletLabel")}</Label>
                <Input
                  id="deposit-wallet"
                  value={settings.wallet_number}
                  placeholder="01001234567"
                  onChange={(e) => set("wallet_number", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="deposit-names"
                className="flex items-center gap-1.5"
              >
                {t("admin.deposits.namesLabel")}
                <HelpTip text={t("admin.deposits.namesHelp")} />
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

        <SettingsSectionGroup title={t("admin.deposits.sectionConfirmation")}>
          <label className="flex items-start gap-2.5">
            <Checkbox
              checked={settings.auto_confirm}
              onCheckedChange={(next) => set("auto_confirm", next === true)}
              className="mt-0.5"
            />
            <span className="text-sm">
              {t("admin.deposits.autoConfirm")}
              <span className="block text-xs text-[var(--admin-muted)]">
                {t("admin.deposits.autoConfirmHint")}
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
              {t("admin.deposits.ocrCrossCheck")}
              <span className="block text-xs text-[var(--admin-muted)]">
                {t("admin.deposits.ocrCrossCheckHintPre")}{" "}
                <strong>{t("admin.deposits.ocrCrossCheckNot")}</strong>{" "}
                {t("admin.deposits.ocrCrossCheckHintPost")}
              </span>
            </span>
          </label>

          <details className="mt-3 rounded-lg border border-[var(--admin-border)] px-3 py-2">
            <summary className="cursor-pointer text-sm">
              {t("admin.deposits.fineTuning")}
            </summary>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="deposit-confidence">{t("admin.deposits.minConfidence")}</Label>
                <Input
                  id="deposit-confidence"
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  value={numberValue("min_confidence")}
                  onChange={(e) => setNumber("min_confidence", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit-tolerance">
                  {t("admin.deposits.amountTolerance")}
                </Label>
                <Input
                  id="deposit-tolerance"
                  type="number"
                  min={0}
                  value={numberValue("amount_tolerance_egp")}
                  onChange={(e) =>
                    setNumber("amount_tolerance_egp", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit-age">
                  {t("admin.deposits.maxAgeHours")}
                </Label>
                <Input
                  id="deposit-age"
                  type="number"
                  min={1}
                  max={720}
                  value={numberValue("receipt_max_age_hours")}
                  onChange={(e) =>
                    setNumber("receipt_max_age_hours", e.target.value)
                  }
                />
              </div>
            </div>
          </details>
        </SettingsSectionGroup>

        {problem ? (
          // On screen rather than in a toast: the refusal usually names a field
          // other than the one just changed, and a message that disappears turns
          // that into a switch that mysteriously flicks itself back off.
          <p
            role="alert"
            className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]"
          >
            {problem}
          </p>
        ) : null}
      </div>
    </div>
  );
}

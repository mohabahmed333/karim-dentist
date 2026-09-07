"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  upsertSettings,
  type SiteSettings,
} from "@/services/site_settings";
import {
  dashboardThemeSchema,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
  normalizeHexColor,
} from "@/services/site_settings/dashboardTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import { useTranslations } from "@/lib/i18n";

type Props = { settings: SiteSettings | null };

export function SettingsDashboardForm({ settings: initial }: Props) {
  const t = useTranslations();
  const [settings, setSettings] = useState(initial);
  const [primary, setPrimary] = useState(
    normalizeHexColor(
      initial?.dashboard_primary_color,
      DEFAULT_DASHBOARD_PRIMARY,
    ),
  );
  const [secondary, setSecondary] = useState(
    normalizeHexColor(
      initial?.dashboard_secondary_color,
      DEFAULT_DASHBOARD_SECONDARY,
    ),
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = dashboardThemeSchema.safeParse({
      dashboard_primary_color: normalizeHexColor(primary, ""),
      dashboard_secondary_color: normalizeHexColor(secondary, ""),
    });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? t("admin.settings.theme.invalid"),
      );
      return;
    }
    setPending(true);
    try {
      const row = await upsertSettings(settings, parsed.data);
      setSettings(row);
      setPrimary(row.dashboard_primary_color);
      setSecondary(row.dashboard_secondary_color);
      window.dispatchEvent(
        new CustomEvent(ADMIN_THEME_EVENT, {
          detail: {
            primary: row.dashboard_primary_color,
            secondary: row.dashboard_secondary_color,
          },
        }),
      );
      toast.success(t("admin.settings.theme.saved"));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : t("admin.settings.theme.saveFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  const primaryLabel = t("admin.settings.theme.primary");
  const secondaryLabel = t("admin.settings.theme.secondary");

  return (
    <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
      <p className="text-sm text-[#6B7280]">{t("admin.settings.theme.hint")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          id="dashboard_primary_color"
          label={primaryLabel}
          value={primary}
          onChange={setPrimary}
          pickerLabel={t("admin.settings.theme.picker").replace(
            "{label}",
            primaryLabel,
          )}
        />
        <ColorField
          id="dashboard_secondary_color"
          label={secondaryLabel}
          value={secondary}
          onChange={setSecondary}
          pickerLabel={t("admin.settings.theme.picker").replace(
            "{label}",
            secondaryLabel,
          )}
        />
      </div>
      <div className="admin-card flex flex-wrap items-center gap-3 rounded-md border border-[#E2E2E2] bg-[#F5F5F7] p-4">
        <span
          className="inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold text-white"
          style={{ background: primary }}
        >
          {primaryLabel}
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold text-white"
          style={{ background: secondary }}
        >
          {secondaryLabel}
        </span>
        <span
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium"
          style={{ borderColor: primary, color: primary }}
        >
          {t("admin.settings.theme.outline")}
        </span>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("admin.saving") : t("admin.settings.theme.save")}
      </Button>
    </form>
  );
}

function ColorField({
  id,
  label,
  pickerLabel,
  value,
  onChange,
}: {
  id: string;
  label: string;
  pickerLabel: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={pickerLabel}
          value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#5E6AD2"}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-9 w-12 cursor-pointer rounded border border-[#E5E5E5] bg-white p-0.5"
        />
        <Input
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#5E6AD2"
          className="font-mono uppercase"
        />
      </div>
    </div>
  );
}

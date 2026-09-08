"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  upsertSettings,
  type SiteSettings,
} from "@/services/site_settings";
import {
  dashboardThemeSchema,
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PANEL,
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
  const [canvas, setCanvas] = useState(
    normalizeHexColor(
      initial?.dashboard_canvas_color,
      DEFAULT_DASHBOARD_CANVAS,
    ),
  );
  const [panel, setPanel] = useState(
    normalizeHexColor(
      initial?.dashboard_panel_color,
      DEFAULT_DASHBOARD_PANEL,
    ),
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = dashboardThemeSchema.safeParse({
      dashboard_primary_color: normalizeHexColor(primary, ""),
      dashboard_secondary_color: normalizeHexColor(secondary, ""),
      dashboard_canvas_color: normalizeHexColor(canvas, ""),
      dashboard_panel_color: normalizeHexColor(panel, ""),
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
      setCanvas(row.dashboard_canvas_color);
      setPanel(row.dashboard_panel_color);
      window.dispatchEvent(
        new CustomEvent(ADMIN_THEME_EVENT, {
          detail: {
            primary: row.dashboard_primary_color,
            secondary: row.dashboard_secondary_color,
            canvas: row.dashboard_canvas_color,
            content: row.dashboard_panel_color,
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
  const canvasLabel = t("admin.settings.theme.canvas");
  const panelLabel = t("admin.settings.theme.panel");

  return (
    <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
      <p className="text-sm text-[var(--admin-muted)]">
        {t("admin.settings.theme.hint")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)] lg:items-start">
        <DashboardThemeExample
          primary={primary}
          secondary={secondary}
          canvas={canvas}
          content={panel}
          canvasLabel={canvasLabel}
          contentLabel={panelLabel}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          title={t("admin.settings.theme.example")}
          hint={t("admin.settings.theme.exampleHint")
            .replace("{canvas}", canvasLabel)
            .replace("{panel}", panelLabel)}
          outlineLabel={t("admin.settings.theme.outline")}
        />

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
            <ColorField
              id="dashboard_canvas_color"
              label={canvasLabel}
              value={canvas}
              onChange={setCanvas}
              pickerLabel={t("admin.settings.theme.picker").replace(
                "{label}",
                canvasLabel,
              )}
            />
            <ColorField
              id="dashboard_panel_color"
              label={panelLabel}
              value={panel}
              onChange={setPanel}
              pickerLabel={t("admin.settings.theme.picker").replace(
                "{label}",
                panelLabel,
              )}
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.settings.theme.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

function DashboardThemeExample({
  primary,
  secondary,
  canvas,
  content,
  canvasLabel,
  contentLabel,
  primaryLabel,
  secondaryLabel,
  title,
  hint,
  outlineLabel,
}: {
  primary: string;
  secondary: string;
  canvas: string;
  content: string;
  canvasLabel: string;
  contentLabel: string;
  primaryLabel: string;
  secondaryLabel: string;
  title: string;
  hint: string;
  outlineLabel: string;
}) {
  const card = "#FFFFFF";
  return (
    <div className="space-y-2">
      <p className="text-[12px] font-semibold text-[var(--admin-text)]">
        {title}
      </p>
      <div
        className="overflow-hidden rounded-xl border border-[var(--admin-border)]"
        style={{ background: canvas }}
        aria-label={title}
      >
        <div className="flex h-[17.5rem] sm:h-[19rem]">
          <div
            className="flex w-7 shrink-0 flex-col items-center gap-1.5 py-2"
            style={{ background: canvas }}
          >
            <span
              className="size-3.5 rounded-md"
              style={{ background: primary }}
            />
            <span
              className="size-2.5 rounded-full opacity-40"
              style={{ background: primary }}
            />
            <span
              className="size-2.5 rounded-full opacity-25"
              style={{ background: primary }}
            />
            <span
              className="size-2.5 rounded-full opacity-25"
              style={{ background: primary }}
            />
          </div>
          <div
            className="hidden w-[4.25rem] shrink-0 flex-col gap-1.5 border-e border-[var(--admin-border)] p-2 sm:flex"
            style={{ background: card }}
          >
            <span
              className="h-1.5 w-10 rounded-full"
              style={{ background: primary, opacity: 0.85 }}
            />
            <span className="h-1 w-8 rounded-full bg-[var(--admin-border)]" />
            <span className="h-1 w-9 rounded-full bg-[var(--admin-border)]" />
            <span className="h-1 w-7 rounded-full bg-[var(--admin-border)]" />
            <span className="mt-auto h-1 w-8 rounded-full bg-[var(--admin-border)]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-1.5 sm:p-2">
            <div
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--admin-border)]"
              style={{ background: card }}
            >
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-2.5 py-1.5">
                <span className="h-1.5 w-16 rounded-full bg-[var(--admin-border)]" />
                <span
                  className="h-5 rounded-md px-2 text-[9px] font-semibold leading-5 text-white"
                  style={{ background: primary }}
                >
                  {primaryLabel}
                </span>
              </div>
              <div
                className="flex min-h-0 flex-1 flex-col gap-2 p-2.5"
                style={{ background: content }}
              >
                <div className="grid grid-cols-3 gap-1.5">
                  {[0.9, 0.55, 0.7].map((opacity, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-[var(--admin-border)] p-1.5"
                      style={{ background: card }}
                    >
                      <span
                        className="mb-1 block h-1 w-6 rounded-full"
                        style={{ background: secondary, opacity }}
                      />
                      <span className="block h-1 w-8 rounded-full bg-[var(--admin-border)]" />
                    </div>
                  ))}
                </div>
                <div
                  className="min-h-0 flex-1 rounded-md border border-[var(--admin-border)] p-2"
                  style={{ background: card }}
                >
                  <div className="mb-2 flex items-end gap-1">
                    {[40, 70, 45, 85, 55, 65].map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          minHeight: 8,
                          background: i % 2 === 0 ? primary : secondary,
                          opacity: 0.75,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex h-5 items-center rounded px-1.5 text-[9px] font-semibold text-white"
                      style={{ background: primary }}
                    >
                      {primaryLabel}
                    </span>
                    <span
                      className="inline-flex h-5 items-center rounded px-1.5 text-[9px] font-semibold text-white"
                      style={{ background: secondary }}
                    >
                      {secondaryLabel}
                    </span>
                    <span
                      className="inline-flex h-5 items-center rounded border px-1.5 text-[9px] font-medium"
                      style={{ borderColor: primary, color: primary }}
                    >
                      {outlineLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex flex-wrap gap-x-3 gap-y-1 border-t border-[var(--admin-border)] px-3 py-2 text-[10px] text-[var(--admin-muted)]"
          style={{ background: card }}
        >
          <span>
            <span
              className="me-1 inline-block size-2 rounded-sm align-middle"
              style={{ background: canvas, boxShadow: "inset 0 0 0 1px #0002" }}
            />
            {canvasLabel}
          </span>
          <span>
            <span
              className="me-1 inline-block size-2 rounded-sm align-middle"
              style={{
                background: content,
                boxShadow: "inset 0 0 0 1px #0002",
              }}
            />
            {contentLabel}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-[var(--admin-muted)]">{hint}</p>
    </div>
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
          className="h-9 w-12 cursor-pointer rounded border border-[var(--admin-border)] bg-[var(--admin-panel)] p-0.5"
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

"use client";

import { useState } from "react";
import type { SiteSettings } from "@/services/site_settings";
import { useTranslations } from "@/lib/i18n";
import { AdminPageHeader } from "./AdminPageHeader";
import { AdminPageMotion } from "./AdminPageMotion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChartingFeesEditor } from "./ChartingFeesEditor";
import { ClinicHoursEditor } from "./ClinicHoursEditor";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { SettingsDashboardForm } from "./SettingsDashboardForm";
import { SettingsSiteForm } from "./SettingsSiteForm";
import { WhatsappAiSettingsForm } from "./WhatsappAiSettingsForm";

type Props = { settings: SiteSettings | null };
type Tab = "site" | "hours" | "fees" | "dashboard" | "whatsappAi" | "notifications";

export function SettingsEditor({ settings }: Props) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <AdminPageMotion>
      <AdminPageHeader
        title={t("admin.settings.title")}
        description={t("admin.settings.description")}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === "dashboard" ? "default" : "outline"}
          onClick={() => setTab("dashboard")}
        >
          {t("admin.dashboard")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "hours" ? "default" : "outline"}
          onClick={() => setTab("hours")}
        >
          {t("admin.settings.hours")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "site" ? "default" : "outline"}
          onClick={() => setTab("site")}
        >
          {t("admin.settings.brand")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "fees" ? "default" : "outline"}
          onClick={() => setTab("fees")}
        >
          {t("admin.settings.clinic")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "whatsappAi" ? "default" : "outline"}
          onClick={() => setTab("whatsappAi")}
        >
          {t("admin.settings.whatsappAi")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "notifications" ? "default" : "outline"}
          onClick={() => setTab("notifications")}
        >
          {t("admin.settings.notifications")}
        </Button>
      </div>
      {tab === "dashboard" ? (
        <Card className="max-w-4xl gap-0 p-6">
          <SettingsDashboardForm settings={settings} />
        </Card>
      ) : tab === "hours" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <ClinicHoursEditor />
        </Card>
      ) : tab === "fees" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <ChartingFeesEditor />
        </Card>
      ) : tab === "whatsappAi" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <WhatsappAiSettingsForm />
        </Card>
      ) : tab === "notifications" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <NotificationSettingsForm />
        </Card>
      ) : (
        <Card className="w-full max-w-none gap-0 p-6">
          <SettingsSiteForm settings={settings} />
        </Card>
      )}
    </AdminPageMotion>
  );
}

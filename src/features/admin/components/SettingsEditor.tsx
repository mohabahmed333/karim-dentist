"use client";

import { useQueryState } from "nuqs";
import type { SiteSettings } from "@/services/site_settings";
import { useTranslations } from "@/lib/i18n";
import { settingsTabParser } from "@/features/admin/lib/settingsTabs";
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

export function SettingsEditor({ settings }: Props) {
  const t = useTranslations();
  // The selected tab lives in ?tab=, so a refresh or a shared link reopens it.
  const [tab, setTab] = useQueryState("tab", settingsTabParser);

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
          onClick={() => void setTab("dashboard")}
        >
          {t("admin.dashboard")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "clinic-hours" ? "default" : "outline"}
          onClick={() => void setTab("clinic-hours")}
        >
          {t("admin.settings.hours")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "site" ? "default" : "outline"}
          onClick={() => void setTab("site")}
        >
          {t("admin.settings.brand")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "clinic-prices" ? "default" : "outline"}
          onClick={() => void setTab("clinic-prices")}
        >
          {t("admin.settings.clinic")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "whatsapp-ai" ? "default" : "outline"}
          onClick={() => void setTab("whatsapp-ai")}
        >
          {t("admin.settings.whatsappAi")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === "patient-notifications" ? "default" : "outline"}
          onClick={() => void setTab("patient-notifications")}
        >
          {t("admin.settings.notifications")}
        </Button>
      </div>
      {tab === "dashboard" ? (
        <Card className="max-w-4xl gap-0 p-6">
          <SettingsDashboardForm settings={settings} />
        </Card>
      ) : tab === "clinic-hours" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <ClinicHoursEditor />
        </Card>
      ) : tab === "clinic-prices" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <ChartingFeesEditor />
        </Card>
      ) : tab === "whatsapp-ai" ? (
        <Card className="max-w-3xl gap-0 p-6">
          <WhatsappAiSettingsForm />
        </Card>
      ) : tab === "patient-notifications" ? (
        <Card className="max-w-6xl gap-0 p-6">
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

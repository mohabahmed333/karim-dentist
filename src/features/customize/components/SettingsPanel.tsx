"use client";

import { useEffect, useState } from "react";
import { MediaUploadField } from "@/features/admin/components/MediaUploadField";
import { useTranslations } from "@/lib/i18n";
import { useCustomize } from "../context/CustomizeContext";
import { ControlledField } from "./ControlledField";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { HomepageOrderFields } from "./HomepageOrderFields";
import { SettingsContactCustomizeFields } from "./SettingsContactCustomizeFields";

type Tab = "brand" | "contact" | "order";

function isSettingsTab(value: unknown): value is Tab {
  return value === "brand" || value === "contact" || value === "order";
}

export function SettingsPanel() {
  const t = useTranslations();
  const { data, patchSettings } = useCustomize();
  const [tab, setTab] = useState<Tab>("brand");
  const settings = data.settings;

  useEffect(() => {
    const onTourTab = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (isSettingsTab(detail)) setTab(detail);
    };
    window.addEventListener("customize-tour-settings-tab", onTourTab);
    return () =>
      window.removeEventListener("customize-tour-settings-tab", onTourTab);
  }, []);

  if (!settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  return (
    <EditorPanelShell>
      <EditorSectionHeader title="Settings" />
      <EditorSegmentTabs
        ariaLabel="Settings editor"
        value={tab}
        options={[
          { id: "brand", label: "Brand" },
          { id: "contact", label: "Contact" },
          { id: "order", label: "Order" },
        ]}
        onChange={setTab}
      />
      {tab === "brand" ? (
        <EditorFieldCard>
          <MediaUploadField
            label="Header logo (PNG)"
            bucket="about"
            folder="brand"
            mediaType="image"
            onMediaTypeChange={() => undefined}
            value={settings.brand_logo_url}
            onChange={(brand_logo_url) => patchSettings({ brand_logo_url })}
            removeLabel={t("admin.customize.removeLogo")}
          />
          <ControlledField
            label="Brand name (fallback / alt text)"
            value={settings.brand_name}
            onChange={(brand_name) => patchSettings({ brand_name })}
          />
        </EditorFieldCard>
      ) : null}
      {tab === "contact" ? (
        <EditorFieldCard>
          <SettingsContactCustomizeFields
            settings={settings}
            patchSettings={patchSettings}
          />
        </EditorFieldCard>
      ) : null}
      {tab === "order" ? <HomepageOrderFields /> : null}
    </EditorPanelShell>
  );
}

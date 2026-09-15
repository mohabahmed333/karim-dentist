"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsHintBanner, SettingsSectionGroup } from "@/features/admin/components/SettingsSectionGroup";
import { useTranslations } from "@/lib/i18n";
import { updateInventorySettings } from "@/services/inventory/actions";
import type { InventorySettings } from "@/services/inventory/types";

export function InventorySettingsForm({ initial }: { initial: InventorySettings }) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    mode: initial.mode,
    manager_whatsapp_phone: initial.manager_whatsapp_phone ?? "",
    wastage_approval_threshold_egp: String(initial.wastage_approval_threshold_egp),
    wastage_photo_threshold_egp: String(initial.wastage_photo_threshold_egp),
    realert_after_days: String(initial.realert_after_days),
  });

  async function onSave() {
    setPending(true);
    try {
      await updateInventorySettings({
        mode: form.mode,
        manager_whatsapp_phone: form.manager_whatsapp_phone || null,
        wastage_approval_threshold_egp: Number(form.wastage_approval_threshold_egp),
        wastage_photo_threshold_egp: Number(form.wastage_photo_threshold_egp),
        realert_after_days: Number(form.realert_after_days),
      });
      toast.success(t("admin.pages.inventory.settings.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHintBanner>{t("admin.pages.inventory.settings.banner")}</SettingsHintBanner>

      <SettingsSectionGroup
        title={t("admin.pages.inventory.settings.alertsHeading")}
        hint={t("admin.pages.inventory.settings.alertsHint")}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>{t("admin.pages.inventory.settings.mode")}</Label>
            <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v as InventorySettings["mode"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">{t("admin.pages.inventory.settings.modeOff")}</SelectItem>
                <SelectItem value="dry_run">{t("admin.pages.inventory.settings.modeDryRun")}</SelectItem>
                <SelectItem value="send">{t("admin.pages.inventory.settings.modeSend")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="manager-phone">{t("admin.pages.inventory.settings.managerPhone")}</Label>
            <Input
              id="manager-phone"
              placeholder={t("admin.pages.inventory.settings.managerPhonePlaceholder")}
              value={form.manager_whatsapp_phone}
              onChange={(e) => setForm((f) => ({ ...f, manager_whatsapp_phone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="realert">{t("admin.pages.inventory.settings.realert")}</Label>
            <Input
              id="realert"
              type="number"
              min="1"
              value={form.realert_after_days}
              onChange={(e) => setForm((f) => ({ ...f, realert_after_days: e.target.value }))}
            />
          </div>
        </div>
      </SettingsSectionGroup>

      <SettingsSectionGroup
        title={t("admin.pages.inventory.settings.dualControlHeading")}
        hint={t("admin.pages.inventory.settings.dualControlHint")}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="approval-threshold">{t("admin.pages.inventory.settings.approvalThreshold")}</Label>
            <Input
              id="approval-threshold"
              type="number"
              min="0"
              value={form.wastage_approval_threshold_egp}
              onChange={(e) => setForm((f) => ({ ...f, wastage_approval_threshold_egp: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="photo-threshold">{t("admin.pages.inventory.settings.photoThreshold")}</Label>
            <Input
              id="photo-threshold"
              type="number"
              min="0"
              value={form.wastage_photo_threshold_egp}
              onChange={(e) => setForm((f) => ({ ...f, wastage_photo_threshold_egp: e.target.value }))}
            />
          </div>
        </div>
      </SettingsSectionGroup>

      <div className="flex justify-end">
        <Button type="button" disabled={pending} onClick={onSave}>
          {pending ? t("admin.saving") : t("admin.save")}
        </Button>
      </div>
    </div>
  );
}

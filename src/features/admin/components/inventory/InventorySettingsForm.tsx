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
import { updateInventorySettings } from "@/services/inventory/actions";
import type { InventorySettings } from "@/services/inventory/types";

export function InventorySettingsForm({ initial }: { initial: InventorySettings }) {
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
      toast.success("Inventory settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsHintBanner>
        Low-stock alerts start switched off. Move to &quot;Test run&quot; to see what would be sent
        without messaging anyone, then &quot;Send&quot; once the manager&apos;s WhatsApp number and
        an approved template are ready.
      </SettingsHintBanner>

      <SettingsSectionGroup
        title="Low-stock WhatsApp alerts"
        hint="Sent to the clinic manager when an item drops to or below its minimum stock level."
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v as InventorySettings["mode"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="dry_run">Test run (records, doesn&apos;t send)</SelectItem>
                <SelectItem value="send">Send</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="manager-phone">Manager WhatsApp number</Label>
            <Input
              id="manager-phone"
              placeholder="e.g. 201001234567"
              value={form.manager_whatsapp_phone}
              onChange={(e) => setForm((f) => ({ ...f, manager_whatsapp_phone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="realert">Re-alert after (days)</Label>
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
        title="Wastage dual control"
        hint="Wastage or a negative recount above these thresholds needs a second admin to confirm before it's final."
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="approval-threshold">Approval threshold (EGP)</Label>
            <Input
              id="approval-threshold"
              type="number"
              min="0"
              value={form.wastage_approval_threshold_egp}
              onChange={(e) => setForm((f) => ({ ...f, wastage_approval_threshold_egp: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="photo-threshold">Photo required above (EGP)</Label>
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
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

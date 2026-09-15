"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import { createSupplier, updateSupplier } from "@/services/inventory/actions";
import type { Supplier } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSaved: (supplier: Supplier) => void;
};

export function SupplierFormDialog({ open, onOpenChange, supplier, onSaved }: Props) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState(() => seed(supplier));
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const key = open ? (supplier?.id ?? "new") : null;
  if (open && key !== seededFor) {
    setSeededFor(key);
    setForm(seed(supplier));
  }

  async function onSave() {
    setPending(true);
    try {
      const saved = supplier
        ? await updateSupplier(supplier.id, form)
        : await createSupplier(form);
      onSaved(saved);
      toast.success(supplier ? t("admin.pages.inventory.supplier.updated") : t("admin.pages.inventory.supplier.added"));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {supplier ? t("admin.pages.inventory.supplier.editTitle") : t("admin.pages.inventory.supplier.newTitle")}
          </DialogTitle>
          <DialogDescription>{t("admin.pages.inventory.supplier.desc")}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="sup-name">{t("admin.pages.inventory.supplier.name")}</Label>
            <Input id="sup-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-contact">{t("admin.pages.inventory.supplier.contactName")}</Label>
            <Input id="sup-contact" value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-phone">{t("admin.pages.inventory.supplier.phone")}</Label>
            <Input id="sup-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-wa">{t("admin.pages.inventory.supplier.whatsapp")}</Label>
            <Input
              id="sup-wa"
              placeholder={t("admin.pages.inventory.supplier.whatsappPlaceholder")}
              value={form.whatsapp_phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_phone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-email">{t("admin.pages.inventory.supplier.email")}</Label>
            <Input id="sup-email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="sup-notes">{t("admin.pages.inventory.supplier.notes")}</Label>
            <Textarea id="sup-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("admin.cancel")}
          </Button>
          <Button type="button" disabled={pending || !form.name.trim()} onClick={onSave}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function seed(supplier: Supplier | null) {
  return {
    name: supplier?.name ?? "",
    contact_name: supplier?.contact_name ?? "",
    phone: supplier?.phone ?? "",
    whatsapp_phone: supplier?.whatsapp_phone ?? "",
    email: supplier?.email ?? "",
    notes: supplier?.notes ?? "",
  };
}

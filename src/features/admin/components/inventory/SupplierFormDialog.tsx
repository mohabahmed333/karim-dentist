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
import { createSupplier, updateSupplier } from "@/services/inventory/actions";
import type { Supplier } from "@/services/inventory/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSaved: (supplier: Supplier) => void;
};

export function SupplierFormDialog({ open, onOpenChange, supplier, onSaved }: Props) {
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
      toast.success(supplier ? "Supplier updated" : "Supplier added");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>
            Used for reorder suggestions on low-stock WhatsApp alerts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="sup-name">Name</Label>
            <Input id="sup-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-contact">Contact name</Label>
            <Input id="sup-contact" value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-phone">Phone</Label>
            <Input id="sup-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-wa">WhatsApp phone</Label>
            <Input
              id="sup-wa"
              placeholder="Defaults to phone"
              value={form.whatsapp_phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp_phone: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="sup-email">Email</Label>
            <Input id="sup-email" value={form.email ?? ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label htmlFor="sup-notes">Notes</Label>
            <Textarea id="sup-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !form.name.trim()} onClick={onSave}>
            {pending ? "Saving…" : "Save"}
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

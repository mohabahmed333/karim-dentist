"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { saveTreatmentProposal } from "@/services/treatment_proposals/actions";
import { resolveServiceDoctorPrice, extractSingleAmount } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";

type PriceableService = { id: string; title: string; price_label: string | null };
type PriceableDoctor = { id: string; display_name: string | null };

type DraftItem = { serviceId: string; description: string; amount: string };

function emptyItem(): DraftItem {
  return { serviceId: "", description: "", amount: "" };
}

type Props = {
  patientKey: string;
  patientPhone: string;
  patientName: string;
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  onSent: () => void;
};

export function ProposeServicesForm({
  patientKey,
  patientPhone,
  patientName,
  services,
  doctors,
  serviceDoctorMappings,
  onSent,
}: Props) {
  const [doctorId, setDoctorId] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [pending, setPending] = useState(false);

  function patchItem(index: number, partial: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  }

  function pickService(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    const price = doctorId
      ? resolveServiceDoctorPrice(serviceId, doctorId, serviceDoctorMappings, service?.price_label ?? null)
      : (service?.price_label ?? null);
    patchItem(index, {
      serviceId,
      description: service?.title ?? "",
      amount: extractSingleAmount(price) ?? "",
    });
  }

  async function onSubmit() {
    if (!doctorId) {
      toast.error("Pick a doctor");
      return;
    }
    const parsedItems = items
      .filter((item) => item.serviceId)
      .map((item) => ({
        serviceId: item.serviceId,
        description: item.description.trim(),
        amountEgp: Number(item.amount),
      }));
    if (parsedItems.length === 0) {
      toast.error("Add at least one service");
      return;
    }
    if (parsedItems.some((item) => !Number.isFinite(item.amountEgp) || item.amountEgp <= 0)) {
      toast.error("Enter a valid amount for every service");
      return;
    }
    setPending(true);
    try {
      await saveTreatmentProposal(patientKey, patientPhone, patientName, {
        doctorId,
        items: parsedItems,
      });
      setDoctorId("");
      setItems([emptyItem()]);
      toast.success("Proposal sent");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-3xl gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">Propose services</p>
      <AdminSelect value={doctorId} onValueChange={(value) => setDoctorId(String(value))}>
        <AdminSelectTrigger>
          <AdminSelectValue placeholder="Doctor" />
        </AdminSelectTrigger>
        <AdminSelectContent>
          {doctors.map((doctor) => (
            <AdminSelectItem key={doctor.id} value={doctor.id}>
              {doctor.display_name ?? "Unnamed"}
            </AdminSelectItem>
          ))}
        </AdminSelectContent>
      </AdminSelect>

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <AdminSelect value={item.serviceId} onValueChange={(value) => pickService(index, String(value))}>
            <AdminSelectTrigger>
              <AdminSelectValue placeholder="Service" />
            </AdminSelectTrigger>
            <AdminSelectContent>
              {services.map((service) => (
                <AdminSelectItem key={service.id} value={service.id}>
                  {service.title}
                </AdminSelectItem>
              ))}
            </AdminSelectContent>
          </AdminSelect>
          <AdminInput
            placeholder="Amount (EGP)"
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => patchItem(index, { amount: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length === 1}
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        Add service
      </Button>
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending ? "Sending…" : "Send proposal"}
      </Button>
    </Card>
  );
}

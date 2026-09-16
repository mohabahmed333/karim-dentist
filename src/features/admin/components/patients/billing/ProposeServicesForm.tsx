"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
  AdminTextarea,
} from "@/features/admin/ui";
import { useLocale, useTranslations } from "@/lib/i18n";
import { saveTreatmentProposal } from "@/services/treatment_proposals/actions";
import {
  resolveServiceDoctorPrice,
  extractSingleAmount,
  type PriceableService,
  type PriceableDoctor,
} from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import type { Reservation } from "@/services/reservations/types";
import { formatAppointmentDateTime } from "@/services/patient_notifications/formatWhen";
import { ServiceSearchSelect } from "./ServiceSearchSelect";
import Link from "next/link";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { isBillableVisit } from "@/services/reservations/billableVisit";

export type DraftItem = { serviceId: string; description: string; amount: string };

function emptyItem(): DraftItem {
  return { serviceId: "", description: "", amount: "" };
}

/**
 * Not a real reservation id — the value the "no specific visit" option
 * carries. Select items can't take an empty-string value, so this is a
 * sentinel, converted back to null right before it's sent.
 */
const NO_RESERVATION = "none";

type Props = {
  patientKey: string;
  patientPhone: string;
  patientName: string;
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  /** This patient's visits, for the optional "which visit is this for?" picker. */
  reservations: Reservation[];
  /**
   * Whether this user can go and set a price. Only gates the shortcut link —
   * the amount is read-only for everyone, because a fee belongs to the service
   * and not to whichever bill happens to mention it.
   */
  canManagePrices?: boolean;
  onSent: () => void;
  /** Seeds the form instead of starting blank — e.g. an AI draft proposing a starting point. */
  initialDoctorId?: string;
  initialItems?: DraftItem[];
  initialReservationId?: string | null;
  /**
   * Hide the doctor picker because we already know who is billing — a doctor
   * billing their own patient shouldn't have to find themselves in a list.
   * Ignored without an `initialDoctorId`, so it can never hide the only way
   * to set a required field.
   */
  lockDoctor?: boolean;
  /** Drop the Card wrapper — inside a dialog it double-pads. */
  bare?: boolean;
  /** `null` hides the heading, for a dialog that has its own title. */
  title?: string | null;
  submitLabel?: string;
};

export function ProposeServicesForm({
  patientKey,
  patientPhone,
  patientName,
  services,
  doctors,
  serviceDoctorMappings,
  reservations,
  canManagePrices = false,
  onSent,
  initialDoctorId,
  initialItems,
  initialReservationId,
  lockDoctor = false,
  bare = false,
  title,
  submitLabel,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [items, setItems] = useState<DraftItem[]>(initialItems ?? [emptyItem()]);
  const [reservationId, setReservationId] = useState(() => {
    if (!initialReservationId) return NO_RESERVATION;
    const visit = reservations.find((row) => row.id === initialReservationId);
    // A caller can open this for an upcoming appointment; the bill then simply
    // is not tied to a visit, rather than naming one that cannot be billed.
    return visit && isBillableVisit(visit) ? initialReservationId : NO_RESERVATION;
  });
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const hideDoctor = lockDoctor && Boolean(initialDoctorId);
  const heading = title === undefined ? t("admin.billing.proposal.title") : title;

  function patchItem(index: number, partial: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  }

  function priceFor(serviceId: string): string {
    if (!serviceId) return "";
    const service = services.find((s) => s.id === serviceId);
    const price = doctorId
      ? resolveServiceDoctorPrice(serviceId, doctorId, serviceDoctorMappings, service?.price_label ?? null)
      : (service?.price_label ?? null);
    return extractSingleAmount(price) ?? "";
  }

  function pickService(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    patchItem(index, {
      serviceId,
      description: service?.title ?? "",
      amount: priceFor(serviceId),
    });
  }

  // A doctor's own fee can differ from the clinic's, so the amounts already on
  // the form have to be re-read when the doctor changes — nobody can correct
  // them by hand any more.
  function changeDoctor(nextDoctorId: string) {
    setDoctorId(nextDoctorId);
    setItems((prev) =>
      prev.map((item) => {
        if (!item.serviceId) return item;
        const service = services.find((s) => s.id === item.serviceId);
        const price = nextDoctorId
          ? resolveServiceDoctorPrice(
              item.serviceId,
              nextDoctorId,
              serviceDoctorMappings,
              service?.price_label ?? null,
            )
          : (service?.price_label ?? null);
        return { ...item, amount: extractSingleAmount(price) ?? "" };
      }),
    );
  }

  async function onSubmit() {
    if (!doctorId) {
      toast.error(t("admin.billing.proposal.pickDoctor"));
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
      toast.error(t("admin.billing.proposal.addAtLeastOne"));
      return;
    }
    if (parsedItems.some((item) => !Number.isFinite(item.amountEgp) || item.amountEgp <= 0)) {
      toast.error(t("admin.billing.proposal.priceMissing"));
      return;
    }
    setPending(true);
    try {
      await saveTreatmentProposal(patientKey, patientPhone, patientName, {
        doctorId,
        items: parsedItems,
        reservationId: reservationId === NO_RESERVATION ? null : reservationId,
        note: note.trim() || undefined,
      });
      // A locked doctor is who the user is, not a choice they made — keep it.
      if (!hideDoctor) setDoctorId("");
      setItems([emptyItem()]);
      setReservationId(NO_RESERVATION);
      setNote("");
      toast.success(t("admin.billing.proposal.sent"));
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.billing.proposal.sendFailed"));
    } finally {
      setPending(false);
    }
  }

  // Only visits that have happened. Listing next week's appointment invites a
  // bill for work nobody has done yet, which the server refuses anyway.
  const billableVisits = reservations.filter((row) => isBillableVisit(row));

  const Wrapper = bare ? BareWrapper : CardWrapper;

  return (
    <Wrapper>
      {heading ? (
        <p className="text-sm font-medium text-[var(--admin-text)]">{heading}</p>
      ) : null}
      {hideDoctor ? null : (
        <AdminSelect value={doctorId} onValueChange={(value) => changeDoctor(String(value))}>
          <AdminSelectTrigger>
            <AdminSelectValue placeholder={t("admin.billing.form.doctorPlaceholder")} />
          </AdminSelectTrigger>
          <AdminSelectContent alignItemWithTrigger={false}>
            {doctors.map((doctor) => (
              <AdminSelectItem key={doctor.id} value={doctor.id}>
                {doctor.display_name ?? t("admin.billing.form.unnamedDoctor")}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      )}

      {billableVisits.length > 0 ? (
        <AdminSelect
          value={reservationId}
          onValueChange={(value) => setReservationId(String(value))}
        >
          <AdminSelectTrigger>
            <AdminSelectValue placeholder={t("admin.billing.form.visitPlaceholder")} />
          </AdminSelectTrigger>
          <AdminSelectContent alignItemWithTrigger={false}>
            <AdminSelectItem value={NO_RESERVATION}>{t("admin.billing.form.notTiedToVisit")}</AdminSelectItem>
            {billableVisits.map((reservation) => (
              <AdminSelectItem key={reservation.id} value={reservation.id}>
                {reservation.service_label} — {formatAppointmentDateTime(reservation.starts_at, "en")}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      ) : null}

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <ServiceSearchSelect
            services={services}
            value={item.serviceId}
            onChange={(serviceId) => pickService(index, serviceId)}
            placeholder={t("admin.billing.proposal.servicePlaceholder")}
          />
          {/* Read-only: the fee belongs to the service, so it is corrected
              once in the catalogue rather than re-typed into every bill. */}
          <div className="flex min-w-0 items-center gap-2">
            {item.amount ? (
              <output className="truncate text-sm font-semibold tabular-nums text-[var(--admin-text)]">
                {formatEgp(Number(item.amount), locale)}
              </output>
            ) : (
              <span className="truncate text-sm text-[var(--admin-muted)]">
                {item.serviceId
                  ? t("admin.billing.proposal.noPrice")
                  : t("admin.billing.proposal.pickServiceFirst")}
              </span>
            )}
            {canManagePrices && item.serviceId && !item.amount ? (
              <Link
                href="/admin/settings/prices"
                className="shrink-0 text-xs font-medium text-[var(--admin-primary)] underline-offset-2 hover:underline"
              >
                {t("admin.billing.proposal.setPrice")}
              </Link>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length === 1}
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
          >
            {t("admin.billing.proposal.remove")}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        {t("admin.billing.proposal.addService")}
      </Button>
      <AdminTextarea
        rows={2}
        maxLength={500}
        value={note}
        placeholder={t("admin.billing.proposal.notePlaceholder")}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending
          ? t("admin.billing.proposal.sending")
          : (submitLabel ?? t("admin.billing.proposal.send"))}
      </Button>
    </Wrapper>
  );
}

function CardWrapper({ children }: { children: ReactNode }) {
  return <Card className="h-full gap-3 bg-transparent p-6">{children}</Card>;
}

function BareWrapper({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

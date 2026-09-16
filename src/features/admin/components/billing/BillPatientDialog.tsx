"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import {
  ProposeServicesForm,
  type DraftItem,
} from "@/features/admin/components/patients/billing/ProposeServicesForm";
import {
  loadBillingFormOptions,
  type BillingFormOptions,
} from "@/services/treatment_proposals/actions";
import { resolveServiceDoctorPriceEgp } from "@/services/service_doctors/pricing";
import { formatAppointmentDateTime } from "@/services/patient_notifications/formatWhen";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { Reservation } from "@/services/reservations/types";
import { useLocale, useTranslations } from "@/lib/i18n";

/** The visit this bill belongs to, when the dialog was opened from one. */
export type BillingVisit = {
  id: string;
  serviceId: string | null;
  serviceLabel: string;
  startsAt: string;
  doctorId: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientKey: string;
  patientPhone: string;
  patientName: string;
  /** This patient's visits, for the "which visit?" picker. */
  reservations: Reservation[];
  visit?: BillingVisit | null;
  /**
   * The patient's charted work. Given, the bill is seeded from what was
   * actually done in this visit; omitted, it falls back to the booked service,
   * which is all the callers without a chart loaded can offer.
   */
  treatments?: TreatmentItem[];
  /** The signed-in doctor, decided server-side. Null for everyone else. */
  currentDoctorId: string | null;
  /** True when the user isn't a doctor, so they must say who did the work. */
  canPickDoctor: boolean;
};

/**
 * Bill a patient in one step: the doctor is already known, the visit's
 * service is already picked, and the price comes from the catalog — so the
 * common case is "open, glance, send".
 *
 * Loads its own pickers rather than taking them as props: it opens from the
 * overview drawer and the bookings drawer too, and neither of those pages
 * loads the service catalog or doctor list.
 */
export function BillPatientDialog({
  open,
  onOpenChange,
  patientKey,
  patientPhone,
  patientName,
  reservations,
  visit = null,
  treatments,
  currentDoctorId,
  canPickDoctor,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const [options, setOptions] = useState<BillingFormOptions | null>(null);

  useEffect(() => {
    if (!open || options) return;
    let alive = true;
    void loadBillingFormOptions()
      .then((next) => {
        if (alive) setOptions(next);
      })
      .catch(() => {
        if (!alive) return;
        toast.error(t("admin.billing.optionsFailed"));
        onOpenChange(false);
      });
    return () => {
      alive = false;
    };
  }, [open, options, onOpenChange, t]);

  // A doctor bills as themselves; an owner billing from an appointment bills
  // as whoever is seeing the patient.
  const initialDoctorId = currentDoctorId ?? visit?.doctorId ?? undefined;
  const initialItems = options
    ? seedItems(options, visit, treatments, initialDoctorId)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">
            {t("admin.billing.billDialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            {visit
              ? `${patientName} · ${visit.serviceLabel} — ${formatAppointmentDateTime(visit.startsAt, locale)}`
              : patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {options ? (
            <ProposeServicesForm
              key={visit?.id ?? "no-visit"}
              bare
              title={null}
              patientKey={patientKey}
              patientPhone={patientPhone}
              patientName={patientName}
              services={options.services}
              doctors={options.doctors}
              serviceDoctorMappings={options.serviceDoctorMappings}
              canManagePrices={options.canManagePrices}
              reservations={reservations}
              initialDoctorId={initialDoctorId}
              initialItems={initialItems}
              initialReservationId={visit?.id ?? null}
              lockDoctor={!canPickDoctor}
              submitLabel={t("admin.billing.sendToFrontDesk")}
              onSent={() => {
                onOpenChange(false);
                router.refresh();
              }}
            />
          ) : (
            <div className="space-y-2 py-2" aria-label={t("admin.billing.loadingOptions")}>
              <AdminSkeleton className="h-9 w-full rounded-lg" />
              <AdminSkeleton className="h-9 w-full rounded-lg" />
              <AdminSkeleton className="h-20 w-full rounded-lg" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * What to put in the bill before anyone types.
 *
 * The work the doctor actually finished in this visit, one line each — that is
 * what the patient owes for, and it is rarely the single service the
 * appointment was booked under. A visit booked as a consultation where two
 * fillings were done should bill as two fillings.
 *
 * Only `done` treatments: billing work that has not been carried out yet is
 * how a patient gets charged for a plan rather than a visit.
 *
 * Falls back to the booked service when the chart has nothing for this visit,
 * so the dialog is never blank — that also covers the callers that do not load
 * a chart at all and pass no treatments.
 */
function seedItems(
  options: BillingFormOptions,
  visit: BillingVisit | null,
  treatments: TreatmentItem[] | undefined,
  doctorId: string | undefined,
): DraftItem[] | undefined {
  const done = (treatments ?? []).filter(
    (item) =>
      item.status === "done" && visit != null && item.reservationId === visit.id,
  );

  if (done.length > 0) {
    return done.map((item) => seedFromTreatment(options, item, doctorId));
  }

  if (!visit?.serviceId) return undefined;
  const service = options.services.find((s) => s.id === visit.serviceId);
  return [
    {
      serviceId: visit.serviceId,
      description: service?.title ?? visit.serviceLabel,
      amount: amountFor(options, visit.serviceId, doctorId) ?? "",
    },
  ];
}

function seedFromTreatment(
  options: BillingFormOptions,
  item: TreatmentItem,
  doctorId: string | undefined,
): DraftItem {
  const serviceId = item.serviceId ?? "";
  const service = options.services.find((s) => s.id === serviceId);
  // The treatment names the tooth it was done on; the bill should say so, since
  // two fillings on one visit are otherwise indistinguishable on the receipt.
  const label = service?.title ?? item.lastTreatment ?? "";
  const description = item.toothName ? `${label} — ${item.toothName}` : label;

  // The doctor's fee for the service, else whatever fee the treatment was
  // recorded with — an ad-hoc treatment with no service still has to bill.
  const resolved = serviceId ? amountFor(options, serviceId, doctorId) : null;
  const fallback = item.feeAmount > 0 ? String(item.feeAmount) : "";

  return { serviceId, description, amount: resolved ?? fallback };
}

/** The doctor's fee for a service as a plain amount string, or null. */
function amountFor(
  options: BillingFormOptions,
  serviceId: string,
  doctorId: string | undefined,
): string | null {
  const service = options.services.find((s) => s.id === serviceId);
  const egp = resolveServiceDoctorPriceEgp(
    serviceId,
    doctorId,
    options.serviceDoctorMappings,
    service,
  );
  return egp === null ? null : String(egp);
}

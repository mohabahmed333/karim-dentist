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
import {
  extractSingleAmount,
  resolveServiceDoctorPrice,
} from "@/services/service_doctors/pricing";
import { formatAppointmentDateTime } from "@/services/patient_notifications/formatWhen";
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
  const initialItems =
    options && visit?.serviceId
      ? [seedItem(options, visit.serviceId, visit.serviceLabel, initialDoctorId)]
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

/** The visit's own service, priced for whoever is billing it. */
function seedItem(
  options: BillingFormOptions,
  serviceId: string,
  serviceLabel: string,
  doctorId: string | undefined,
): DraftItem {
  const service = options.services.find((s) => s.id === serviceId);
  const price = doctorId
    ? resolveServiceDoctorPrice(
        serviceId,
        doctorId,
        options.serviceDoctorMappings,
        service?.price_label ?? null,
      )
    : (service?.price_label ?? null);
  return {
    serviceId,
    description: service?.title ?? serviceLabel,
    amount: extractSingleAmount(price) ?? "",
  };
}

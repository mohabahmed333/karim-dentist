"use client";

import {
  formatReservationWhen,
  statusBadgeClass,
} from "@/services/reservations/stats";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import { resolveServiceLabel } from "@/features/admin/lib/serviceDisplayName";

type Props = {
  values: ReservationFormValues;
  reservation?: Reservation | null;
  services?: Service[];
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
        {label}
      </dt>
      <dd className="text-[14px] text-[var(--admin-text)]">{value || "—"}</dd>
    </div>
  );
}

function statusLabel(
  status: string,
  t: (key: import("@/lib/i18n").AnyMessageKey) => string,
) {
  switch (status) {
    case "pending":
      return t("admin.reservations.pending");
    case "confirmed":
      return t("admin.reservations.confirmed");
    case "cancelled":
      return t("admin.reservations.cancelled");
    case "completed":
      return t("admin.reservations.completed");
    case "no_show":
      return t("admin.reservations.noShow");
    default:
      return status;
  }
}

export function ReservationDrawerSummary({
  values,
  reservation,
  services = [],
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const when = reservation
    ? formatReservationWhen(reservation.starts_at)
    : [values.date, values.time].filter(Boolean).join(" · ");
  const serviceLabel = resolveServiceLabel({
    locale,
    serviceId: values.service_id ?? reservation?.service_id,
    storedLabel: values.service_label ?? reservation?.service_label,
    services,
    consultationLabel: t("admin.chat.generalConsultation"),
  });

  return (
    <dl className="space-y-4">
      <Row label={t("admin.reservations.patient")} value={values.patient_name} />
      <Row label={t("admin.reservations.phone")} value={values.phone} />
      <Row label={t("admin.reservations.email")} value={values.email ?? ""} />
      <Row label={t("admin.reservations.service")} value={serviceLabel} />
      <Row label={t("admin.reservations.when")} value={when} />
      <div className="grid gap-0.5">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
          {t("admin.reservations.status")}
        </dt>
        <dd>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(values.status)}`}
          >
            {statusLabel(values.status, t)}
          </span>
        </dd>
      </div>
      {values.notes?.trim() ? (
        <Row label={t("admin.reservations.notes")} value={values.notes} />
      ) : null}
    </dl>
  );
}

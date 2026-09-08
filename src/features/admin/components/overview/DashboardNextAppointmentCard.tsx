"use client";

import Link from "next/link";
import type { Reservation } from "@/services/reservations/types";
import { nextAppointmentLine } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

type Props = {
  reservations: Reservation[];
};

export function DashboardNextAppointmentCard({ reservations }: Props) {
  const t = useTranslations();
  const line = nextAppointmentLine(reservations);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col justify-center overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.list.nextTitle")}
      </h2>
      {line ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[var(--admin-text)]">
            {line}
          </p>
          <Link
            href="/admin/reservations"
            className="mt-3 text-xs font-medium text-[var(--admin-primary)] hover:underline"
          >
            {t("admin.overview.list.nextCta")}
          </Link>
        </>
      ) : (
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          {t("admin.overview.scheduleClear")}
        </p>
      )}
    </section>
  );
}

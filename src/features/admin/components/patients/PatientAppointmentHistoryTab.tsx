"use client";

import Link from "next/link";
import { CalendarClock, CircleCheck, CircleSlash, Clock } from "lucide-react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { buildPatientHistoryDetail } from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type { AdminMessageKey } from "@/lib/i18n";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  RecordTimeline,
  RecordTimelineDate,
  RecordTimelineEntry,
  RecordTimelineField,
} from "./RecordTimeline";

type Props = {
  group: PatientGroup;
  reservationsBase?: string;
};

/**
 * The patient's visits, newest first, on the same rail the tooth record uses.
 *
 * Upcoming and past are one list rather than two stacked sections: a visit
 * moves between them by the clock alone, and splitting them broke the thing a
 * history is for — reading straight down the order it happened.
 */
export function PatientAppointmentHistoryTab({
  group,
  reservationsBase = "/admin/reservations",
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const detail = buildPatientHistoryDetail(group);

  const upcomingIds = new Set(detail.upcomingVisits.map((v) => v.id));
  const visits = [...group.visits]
    .filter((visit) => !visit.deleted_at)
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  const intl = locale === "ar" ? "ar-EG" : "en-GB";
  const month = new Intl.DateTimeFormat(intl, { month: "short" });
  const day = new Intl.DateTimeFormat(intl, { day: "2-digit" });
  const time = new Intl.DateTimeFormat(intl, {
    hour: "2-digit",
    minute: "2-digit",
  });
  const year = new Intl.DateTimeFormat(intl, { year: "numeric" });

  if (visits.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-14 text-center text-sm text-[var(--admin-muted)]">
        {t("admin.patientHistory.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4 pt-5">
      <div className="flex flex-wrap gap-2">
        <Count label={t("admin.patientHistory.total")} value={visits.length} />
        <Count
          label={t("admin.patientHistory.upcoming")}
          value={detail.upcomingVisits.length}
        />
        <Count
          label={t("admin.patientHistory.cancelled")}
          value={detail.cancelledVisits.length}
        />
      </div>

      <RecordTimeline>
        {visits.map((visit, index) => {
          const at = new Date(visit.starts_at);
          const upcoming = upcomingIds.has(visit.id);
          return (
            <RecordTimelineEntry
              key={visit.id}
              connected={index < visits.length - 1}
              accent={upcoming}
            >
              <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                <RecordTimelineDate
                  month={month.format(at)}
                  day={day.format(at)}
                />
                <RecordTimelineField
                  label={t("admin.patientHistory.service")}
                  value={visit.service_label || "—"}
                />
                <RecordTimelineField
                  label={t("admin.patientHistory.when")}
                  value={`${time.format(at)} · ${year.format(at)}`}
                />

                <div className="ms-auto flex shrink-0 items-center gap-3">
                  <StatusChip status={visit.status} />
                  <Link
                    href={`${reservationsBase}?q=${encodeURIComponent(group.phone || group.displayName)}`}
                    className="text-xs font-medium text-[var(--admin-primary)] hover:underline"
                  >
                    {t("admin.patientHistory.openReservation")}
                  </Link>
                </div>
              </div>

              {visit.notes ? (
                <p className="mt-3 border-s-2 border-[var(--admin-border)] ps-2 text-sm text-[var(--admin-muted)]">
                  {visit.notes}
                </p>
              ) : null}
            </RecordTimelineEntry>
          );
        })}
      </RecordTimeline>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-1 text-xs text-[var(--admin-muted)]">
      {label}
      <b className="text-sm font-semibold tabular-nums text-[var(--admin-text)]">
        {value}
      </b>
    </span>
  );
}

const STATUS_ICON = {
  completed: CircleCheck,
  confirmed: CircleCheck,
  pending: Clock,
  cancelled: CircleSlash,
  no_show: CircleSlash,
} as const;

/** The labels the reservations screens already use — no second vocabulary. */
const STATUS_LABEL: Record<Reservation["status"], AdminMessageKey> = {
  pending: "admin.reservations.pending",
  confirmed: "admin.reservations.confirmed",
  cancelled: "admin.reservations.cancelled",
  completed: "admin.reservations.completed",
  no_show: "admin.reservations.noShow",
};

function StatusChip({ status }: { status: Reservation["status"] }) {
  const t = useTranslations();
  const Icon = STATUS_ICON[status] ?? CalendarClock;
  const tone =
    status === "completed" || status === "confirmed"
      ? "text-[#16A34A]"
      : status === "pending"
        ? "text-[#D97706]"
        : "text-[var(--admin-muted)]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        tone,
      )}
    >
      <Icon className="size-4" />
      {t(STATUS_LABEL[status])}
    </span>
  );
}

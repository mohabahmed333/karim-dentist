"use client";

import Link from "next/link";
import { CalendarPlus, CircleAlert, Stethoscope } from "lucide-react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  encodePatientKey,
} from "@/services/reservations/patientHistory";
import type { TreatmentItem } from "@/services/patient_treatments";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { buttonVariants } from "@/components/ui/button";
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
  /** Open and scheduled work — what the patient is actually coming back for. */
  treatments: TreatmentItem[];
  reservationsBase?: string;
};

/**
 * What is still to come: the appointments already booked, and the treatments
 * on the plan that have not been carried out.
 *
 * The tab used to show only the bookings, which answered "when are they next
 * in" but not "what for" — the planned treatments live in a different table and
 * were never surfaced here.
 */
export function PatientNextTreatmentTab({
  group,
  treatments,
  reservationsBase = "/admin/reservations",
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const detail = buildPatientHistoryDetail(group);

  const intl = locale === "ar" ? "ar-EG" : "en-GB";
  const month = new Intl.DateTimeFormat(intl, { month: "short" });
  const day = new Intl.DateTimeFormat(intl, { day: "2-digit" });
  const time = new Intl.DateTimeFormat(intl, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const planned = treatments
    .filter((item) => item.status !== "done")
    .sort((a, b) => {
      // Urgent work first, then whatever was raised earliest.
      if (a.severity !== b.severity) return a.severity === "Critical" ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });

  return (
    <div className="space-y-6 pt-5">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-[var(--admin-text)]">
            {t("admin.patientNext.upcoming")} ({detail.upcomingVisits.length})
          </h3>
          <Link
            href={`${reservationsBase}?new=1&patient=${encodePatientKey(group.patientKey)}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <CalendarPlus className="size-3.5" />
            {t("admin.patientNext.book")}
          </Link>
        </div>

        {detail.upcomingVisits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
            {t("admin.patientNext.noUpcoming")}
          </p>
        ) : (
          <RecordTimeline>
            {detail.upcomingVisits.map((visit, index) => {
              const at = new Date(visit.starts_at);
              return (
                <RecordTimelineEntry
                  key={visit.id}
                  connected={index < detail.upcomingVisits.length - 1}
                  accent
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
                      value={time.format(at)}
                    />
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
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--admin-text)]">
          {t("admin.patientNext.planned")} ({planned.length})
        </h3>

        {planned.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
            {t("admin.patientNext.noPlanned")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {planned.map((item) => {
              const urgent = item.severity === "Critical";
              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white",
                        urgent ? "bg-[#DC2626]" : "bg-[var(--admin-secondary)]",
                      )}
                    >
                      {urgent ? (
                        <CircleAlert className="size-4" />
                      ) : (
                        <Stethoscope className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                        {item.lastTreatment || item.cdtCode || "—"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--admin-muted)]">
                        {item.toothName}
                        {item.toothFdi ? ` · ${item.toothFdi}` : ""}
                      </p>
                    </div>
                    {item.feeAmount > 0 ? (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--admin-text)]">
                        {formatEgp(item.feeAmount, locale)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        urgent
                          ? "bg-[color-mix(in_srgb,#DC2626_14%,transparent)] text-[#DC2626]"
                          : "bg-[var(--admin-hover)] text-[var(--admin-muted)]",
                      )}
                    >
                      {t(
                        urgent
                          ? "admin.patientNext.critical"
                          : "admin.patientNext.minor",
                      )}
                    </span>
                    <span className="rounded-full bg-[var(--admin-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--admin-muted)]">
                      {t(
                        item.status === "scheduled"
                          ? "admin.patientNext.scheduled"
                          : "admin.patientNext.open",
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

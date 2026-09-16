"use client";

import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Mail,
  Phone,
  Repeat2,
} from "lucide-react";
import type { ComponentType } from "react";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import {
  buildPatientHistoryDetail,
  formatPatientVisitDate,
} from "@/services/reservations/patientHistory";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PatientMedicalProfile } from "./PatientMedicalProfile";

type Props = {
  group: PatientGroup;
  /**
   * Inside My Day, where the patient header and the stat tiles above the tabs
   * already carry the name, contact and last visit. Drops what would other-
   * wise be said twice on one screen.
   */
  embedded?: boolean;
};

/** Up to two letters, matching the monogram My Day uses for the same patient. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function PatientInfoTab({ group, embedded = false }: Props) {
  const t = useTranslations();
  const detail = buildPatientHistoryDetail(group);
  const { stats } = detail;

  const contact = [
    ...(group.phone ? [{ Icon: Phone, label: group.phone }] : []),
    ...(group.email ? [{ Icon: Mail, label: group.email }] : []),
  ];

  const cards: {
    Icon: ComponentType<{ className?: string }>;
    chip: string;
    labelKey: Parameters<typeof t>[0];
    value: string;
    /** Already on the My Day stat tiles directly above these. */
    duplicatedInMyDay?: boolean;
  }[] = [
    {
      Icon: Repeat2,
      chip: "bg-[#0F766E]",
      labelKey: "admin.patientInfo.totalVisits",
      value: String(stats.visitCount),
    },
    {
      Icon: CalendarPlus,
      chip: "bg-[var(--admin-secondary)]",
      labelKey: "admin.patientInfo.patientSince",
      value: detail.firstVisit
        ? formatPatientVisitDate(detail.firstVisit.starts_at)
        : "—",
    },
    {
      Icon: CalendarCheck,
      chip: "bg-[#7C3AED]",
      labelKey: "admin.patientInfo.lastVisit",
      value: stats.lastVisit
        ? formatPatientVisitDate(stats.lastVisit.starts_at)
        : "—",
      duplicatedInMyDay: true,
    },
    {
      Icon: CalendarClock,
      chip: "bg-[#EA580C]",
      labelKey: "admin.patientInfo.nextVisit",
      value: stats.nextVisit
        ? formatPatientVisitDate(stats.nextVisit.starts_at)
        : "—",
    },
  ];

  const tiles = embedded
    ? cards.filter((card) => !card.duplicatedInMyDay)
    : cards;

  return (
    <div className={cn("space-y-3", embedded ? "pt-3" : "space-y-4 pt-5")}>
      {embedded ? null : (
      <header className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary)] text-lg font-semibold text-white"
        >
          {initials(group.displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight text-[var(--admin-text)]">
            {group.displayName}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--admin-muted)]">
            {contact.map(({ Icon, label }) => (
              <span key={label} className="inline-flex min-w-0 items-center gap-1.5">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate" dir="auto">
                  {label}
                </span>
              </span>
            ))}
          </div>
          {group.alternateNames.length > 0 ? (
            <p className="mt-1 truncate text-xs text-[var(--admin-muted)]">
              {t("admin.patientInfo.alsoKnownAs")}:{" "}
              {group.alternateNames.join(", ")}
            </p>
          ) : null}
        </div>
      </header>
      )}

      {/* My Day already has a row of stat tiles directly above the tab bar.
          A second row of the same component is the biggest thing pushing the
          record down the screen, so embedded gets one line instead. */}
      {embedded ? (
        <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2">
          {tiles.map(({ labelKey, value }) => (
            <div key={labelKey} className="flex min-w-0 items-baseline gap-1.5">
              <dt className="shrink-0 text-xs text-[var(--admin-muted)]">
                {t(labelKey)}
              </dt>
              <dd className="truncate text-sm font-semibold text-[var(--admin-text)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ Icon, chip, labelKey, value }) => (
          <article
            key={labelKey}
            className="admin-card flex items-center gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-[var(--admin-muted)]">
                {t(labelKey)}
              </p>
              <p className="mt-1 truncate text-lg font-semibold tracking-tight text-[var(--admin-text)]">
                {value}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-white",
                chip,
              )}
            >
              <Icon className="size-4" />
            </span>
          </article>
        ))}
      </div>
      )}

      <PatientMedicalProfile group={group} />

      {detail.services.length > 0 ? (
        <section className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--admin-text)]">
            {t("admin.patientInfo.servicesReceived")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {detail.services.map((service) => (
              <span
                key={service.label}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs text-[var(--admin-text)]"
              >
                {service.label}
                <b className="font-semibold tabular-nums text-[var(--admin-muted)]">
                  {service.count}
                </b>
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

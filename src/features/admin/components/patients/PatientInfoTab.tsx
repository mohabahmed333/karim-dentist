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

type Props = { group: PatientGroup };

/** Up to two letters, matching the monogram My Day uses for the same patient. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function PatientInfoTab({ group }: Props) {
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

  return (
    <div className="space-y-4 pt-5">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ Icon, chip, labelKey, value }) => (
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

"use client";

import type { ComponentType } from "react";
import { ClipboardList, History, Scan, Wallet } from "lucide-react";
import type { PatientImaging } from "@/services/patient_imaging";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  balance: number;
  treatments: TreatmentItem[];
  imaging: PatientImaging[];
  /** This patient's whole visit history, for the last-visit tile. */
  visits: PatientGroup["visits"];
  /** Today's visit — excluded from "last visit", it is the one on screen. */
  currentVisitId: string;
  /** Its start, used as the cutoff so the tile is stable across re-renders. */
  currentVisitStartsAt: string;
};

type Tile = {
  label: string;
  value: string;
  Icon: ComponentType<{ className?: string }>;
  /** Fixed accent, matching the dashboard KPI palette. */
  chip: string;
  valueClass?: string;
};

/**
 * The four numbers a doctor wants before touching the chart: what the patient
 * owes, how much work is on their plan, whether there are images to look at,
 * and how long it has been since they were last in.
 */
export function MyDayStats({
  balance,
  treatments,
  imaging,
  visits,
  currentVisitId,
  currentVisitStartsAt,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();

  const owed = balance > 0;
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // "Last visit" means the most recent one before the appointment on screen —
  // that gap is what the doctor is judging. The cutoff is that visit's own
  // start rather than the wall clock, so the tile does not depend on when the
  // component happens to render.
  const cutoff = new Date(currentVisitStartsAt).getTime();
  const previous = visits
    .filter((visit) => visit.id !== currentVisitId)
    .map((visit) => new Date(visit.starts_at).getTime())
    .filter((ms) => Number.isFinite(ms) && ms < cutoff)
    .sort((a, b) => b - a)[0];

  const tiles: Tile[] = [
    {
      label: t(owed ? "admin.myDay.balanceOwed" : "admin.myDay.settled"),
      value: formatEgp(Math.abs(balance), locale),
      Icon: Wallet,
      chip: owed ? "bg-[#DC2626]" : "bg-[#0F766E]",
      valueClass: owed ? "text-[#DC2626]" : "text-[#16A34A]",
    },
    {
      label: t("admin.myDay.treatments"),
      value: String(treatments.length),
      Icon: ClipboardList,
      chip: "bg-[var(--admin-secondary)]",
    },
    {
      label: t("admin.myDay.imaging"),
      value: String(imaging.length),
      Icon: Scan,
      chip: "bg-[#7C3AED]",
    },
    {
      label: t("admin.myDay.lastVisit"),
      value: previous === undefined ? "—" : date.format(new Date(previous)),
      Icon: History,
      chip: "bg-[#EA580C]",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({ label, value, Icon, chip, valueClass }) => (
        <article
          key={label}
          className="admin-card flex items-center gap-3 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-[var(--admin-muted)]">{label}</p>
            <p
              className={cn(
                "mt-1 truncate text-xl font-semibold tracking-tight text-[var(--admin-text)]",
                valueClass,
              )}
            >
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
  );
}

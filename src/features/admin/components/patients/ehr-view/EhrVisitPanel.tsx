"use client";

import { CollectionTable } from "@/features/admin/components/CollectionTable";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { buildPatientHistoryStats } from "@/services/reservations/patientHistory";
import type { EhrVisit } from "./ehr.types";

type Props = {
  group: PatientGroup;
  visits: EhrVisit[];
  onSelect: (id: string) => void;
};

function statusPill(status: string) {
  const key = status.toLowerCase();
  const label = status ? status.replace(/_/g, " ") : "—";
  const tone =
    key === "confirmed" || key === "completed"
      ? "bg-emerald-50 text-emerald-800"
      : key === "pending"
        ? "bg-amber-50 text-amber-900"
        : key === "cancelled" || key === "no_show"
          ? "bg-rose-50 text-rose-800"
          : "bg-[var(--admin-hover)] text-[var(--admin-muted)]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${tone}`}
    >
      {label}
    </span>
  );
}

export function EhrVisitPanel({ group, visits, onSelect }: Props) {
  const rows = [...visits].reverse();
  const stats = buildPatientHistoryStats(group);
  const name = group.displayName || "Patient";
  const aka =
    group.alternateNames.length > 0
      ? group.alternateNames.join(", ")
      : null;

  return (
    <div
      data-ehr-node="visit-panel"
      className="min-h-0 max-h-[280px] overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] [&_td]:text-[var(--admin-primary)]"
    >
      <CollectionTable
        tableId="ehr-visits"
        rows={rows}
        onRowClick={onSelect}
        emptyMessage="No visits yet."
        defaultPageSize={8}
        columns={[
          {
            key: "patient",
            header: "Patient",
            cell: () => (
              <div className="min-w-[8rem]">
                <p className="font-medium text-[var(--admin-primary)]">{name}</p>
                {aka ? (
                  <p className="text-[11px] text-[var(--admin-muted)]">
                    aka {aka}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            key: "phone",
            header: "Phone",
            cell: () => (
              <span className="tabular-nums text-[var(--admin-primary)]">
                {group.phone || "—"}
              </span>
            ),
          },
          {
            key: "email",
            header: "Email",
            cell: () => (
              <span className="max-w-[10rem] truncate text-[var(--admin-primary)]">
                {group.email || "—"}
              </span>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: () => (
              <span className="rounded-full bg-[var(--admin-hover)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-primary)]">
                {stats.isReturning ? "Returning" : "New"}
              </span>
            ),
          },
          {
            key: "date",
            header: "Date",
            cell: (v) => (
              <span className="tabular-nums font-medium text-[var(--admin-primary)]">
                {v.dateLabel}
              </span>
            ),
          },
          {
            key: "time",
            header: "Time",
            cell: (v) => (
              <span className="tabular-nums text-[var(--admin-muted)]">
                {v.timeLabel}
              </span>
            ),
          },
          {
            key: "service",
            header: "Service",
            cell: (v) => (
              <span className="inline-flex max-w-[10rem] truncate rounded-full bg-[var(--admin-hover)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--admin-primary)]">
                {v.serviceLabel}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (v) => statusPill(v.status),
          },
        ]}
      />
    </div>
  );
}

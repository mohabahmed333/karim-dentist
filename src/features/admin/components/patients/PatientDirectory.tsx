"use client";

import Link from "next/link";
import { useState } from "react";
import {
  buildPatientHistoryStats,
  formatPatientVisitDate,
  patientProfilePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { CollectionTable } from "@/features/admin/components/CollectionTable";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";
import { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import { usePatientTableServerFiltering } from "@/features/admin/lib/usePatientTableServerFiltering";
import type { Service } from "@/services/services/types";
import { useTranslations } from "@/lib/i18n";
import { ClientProfileDrawer } from "./workspace/ClientProfileDrawer";

type Props = {
  groups: PatientGroup[];
  total: number;
  services: Service[];
};

type PatientRow = PatientGroup & { id: string };

export function PatientDirectory({
  groups,
  total,
  services,
}: Props) {
  const t = useTranslations();
  const [profileKey, setProfileKey] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  const filterQuery = useReservationFilterQuery(setFiltering);
  const serverFiltering = usePatientTableServerFiltering(total, filterQuery);
  const profileGroup = profileKey
    ? groups.find((g) => g.patientKey === profileKey)
    : null;

  const rows: PatientRow[] = groups.map((g) => ({
    ...g,
    id: g.patientKey,
  }));

  return (
    <div>
      <LocalizedAdminPageHeader
        titleKey="admin.patients.title"
        descriptionKey="admin.patients.description"
        actions={
          <AdminReservationFilters
            services={services}
            showCohort
            onPendingChange={setFiltering}
          />
        }
      />

      {filtering ? (
        <PatientsPageSkeleton tableOnly />
      ) : (
        <CollectionTable
          tableId="patients"
          framed
          rows={rows}
          serverFiltering={serverFiltering}
          emptyMessage={t("admin.patients.empty")}
          searchPlaceholder={t("admin.patients.name")}
          bulkEntityLabel={t("admin.patients.title").toLowerCase()}
          onRowClick={(id) => {
            window.location.href = patientProfilePath(id);
          }}
          rowActions={[
            {
              id: "profile",
              label: t("admin.patients.profile"),
              icon: "edit",
              onClick: (g) => setProfileKey(g.patientKey),
            },
          ]}
          columns={[
            {
              key: "name",
              header: t("admin.patients.name"),
              sortValue: (g) => g.displayName,
              searchValue: (g) => `${g.displayName} ${g.phone}`,
              cell: (g) => (
                <Link
                  href={patientProfilePath(g.patientKey)}
                  className="font-medium text-[var(--admin-text)] hover:text-[var(--admin-primary)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {g.displayName}
                </Link>
              ),
            },
            {
              key: "phone",
              header: t("admin.patients.phone"),
              sortValue: (g) => g.phone,
              cell: (g) => (
                <span className="text-[var(--admin-muted)]">{g.phone}</span>
              ),
            },
            {
              key: "treatments",
              header: t("admin.patients.treatments"),
              sortValue: (g) => buildPatientHistoryStats(g).visitCount,
              cell: (g) => buildPatientHistoryStats(g).visitCount,
            },
            {
              key: "lastVisit",
              header: t("admin.patients.lastVisit"),
              sortValue: (g) =>
                buildPatientHistoryStats(g).lastVisit?.starts_at ?? "",
              cell: (g) => {
                const stats = buildPatientHistoryStats(g);
                return (
                  <span className="text-[var(--admin-muted)]">
                    {stats.lastVisit
                      ? formatPatientVisitDate(stats.lastVisit.starts_at)
                      : "—"}
                  </span>
                );
              },
            },
            {
              key: "nextVisit",
              header: t("admin.patients.nextVisit"),
              sortValue: (g) =>
                buildPatientHistoryStats(g).nextVisit?.starts_at ?? "",
              cell: (g) => {
                const stats = buildPatientHistoryStats(g);
                return (
                  <span className="text-[var(--admin-muted)]">
                    {stats.nextVisit
                      ? formatPatientVisitDate(stats.nextVisit.starts_at)
                      : "—"}
                  </span>
                );
              },
            },
          ]}
        />
      )}

      {profileGroup ? (
        <ClientProfileDrawer
          open
          patientKey={profileGroup.patientKey}
          displayName={profileGroup.displayName}
          phone={profileGroup.phone}
          email={profileGroup.email}
          onClose={() => setProfileKey(null)}
        />
      ) : null}
    </div>
  );
}

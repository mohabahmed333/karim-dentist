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
import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";
import { Button } from "@/components/ui/button";
import type { Service } from "@/services/services/types";
import { useTranslations } from "@/lib/i18n";
import { ClientProfileDrawer } from "./workspace/ClientProfileDrawer";

type Props = {
  groups: PatientGroup[];
  services: Service[];
};

export function PatientDirectory({ groups, services }: Props) {
  const t = useTranslations();
  const [profileKey, setProfileKey] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  const profileGroup = profileKey
    ? groups.find((g) => g.patientKey === profileKey)
    : null;

  return (
    <div className="space-y-4">
      <AdminReservationFilters
        services={services}
        showCohort
        onPendingChange={setFiltering}
      />

      {filtering ? (
        <PatientsPageSkeleton />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <table className="w-full text-start text-sm">
            <thead className="bg-[var(--admin-canvas)]">
              <tr>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.name")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.phone")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.treatments")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.lastVisit")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.nextVisit")}
                </th>
                <th className="px-4 py-3 text-start font-medium text-[var(--admin-muted)]">
                  {t("admin.patients.profile")}
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-[var(--admin-muted)]"
                  >
                    {t("admin.patients.empty")}
                  </td>
                </tr>
              ) : (
                groups.map((group) => {
                  const stats = buildPatientHistoryStats(group);
                  return (
                    <tr
                      key={group.patientKey}
                      className="hover:bg-[var(--admin-hover)]"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={patientProfilePath(group.patientKey)}
                          className="font-medium text-[var(--admin-text)] hover:text-[var(--admin-primary)]"
                        >
                          {group.displayName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">
                        {group.phone}
                      </td>
                      <td className="px-4 py-3">{stats.visitCount}</td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">
                        {stats.lastVisit
                          ? formatPatientVisitDate(stats.lastVisit.starts_at)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--admin-muted)]">
                        {stats.nextVisit
                          ? formatPatientVisitDate(stats.nextVisit.starts_at)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setProfileKey(group.patientKey)}
                        >
                          {t("admin.patients.profile")}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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

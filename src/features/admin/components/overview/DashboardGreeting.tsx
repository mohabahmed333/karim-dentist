"use client";

import {
  greetingKeyForHour,
  nextAppointmentLine,
} from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";
import type { Reservation } from "@/services/reservations/types";
import { AdminUserAvatar } from "@/features/admin/components/AdminUserAvatar";

type Props = {
  email: string | null;
  displayName: string;
  reservations: Reservation[];
  /** Profile photo, when the user has set one. */
  avatarUrl?: string | null;
};

export function DashboardGreeting({
  email,
  displayName,
  reservations,
  avatarUrl = null,
}: Props) {
  const t = useTranslations();
  const hour = new Date().getHours();
  const greeting = t(greetingKeyForHour(hour));
  const nextLine = nextAppointmentLine(reservations);

  return (
    <header className="flex items-start gap-3">
      <AdminUserAvatar
        name={displayName}
        email={email}
        avatarUrl={avatarUrl}
        size="lg"
      />
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--admin-text)] sm:text-3xl">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-[#6b7280]">
          {nextLine
            ? `${t("admin.overview.nextPrefix")} ${nextLine}`
            : t("admin.overview.scheduleClear")}
        </p>
        {email ? (
          <p className="sr-only">
            {t("admin.overview.signedInAs").replace("{email}", email)}
          </p>
        ) : null}
      </div>
    </header>
  );
}

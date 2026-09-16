import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

export type AdminNotificationKey =
  | "bills"
  | "lowStock"
  | "pendingBookings"
  | "overdue"
  | "payments";

export type AdminNotificationCounts = Partial<
  Record<AdminNotificationKey, number>
>;

export type AdminNotificationGroup = {
  key: AdminNotificationKey;
  count: number;
  href: string;
  labelKey: AdminMessageKey;
  /** Who is told. A count nobody can act on is noise. */
  permission: string;
};

/**
 * Every group the bell knows about, in the order it lists them: the ones that
 * cost the clinic money or goodwill first.
 */
export const ADMIN_NOTIFICATION_GROUPS: readonly Omit<
  AdminNotificationGroup,
  "count"
>[] = [
  {
    key: "bills",
    href: "/admin/billing",
    labelKey: "admin.bell.bills",
    permission: "patients.billing.edit",
  },
  {
    key: "payments",
    href: "/admin/billing",
    labelKey: "admin.bell.payments",
    permission: "patients.billing.edit",
  },
  {
    key: "pendingBookings",
    href: "/admin/reservations",
    labelKey: "admin.bell.pendingBookings",
    permission: "reservations.view",
  },
  {
    key: "overdue",
    href: "/admin/reservations",
    labelKey: "admin.bell.overdue",
    permission: "reservations.view",
  },
  {
    key: "lowStock",
    href: "/admin/inventory",
    labelKey: "admin.bell.lowStock",
    permission: "inventory.view",
  },
] as const;

/**
 * The groups this user should see: held permission, and something to show.
 *
 * Empty groups are dropped rather than listed at zero — a bell that always
 * lists five rows stops being read, and "nothing is waiting" is better said by
 * an empty bell than by a column of noughts.
 */
export function visibleNotificationGroups(
  counts: AdminNotificationCounts,
  permissions: ReadonlySet<string>,
): AdminNotificationGroup[] {
  return ADMIN_NOTIFICATION_GROUPS.filter(
    (group) => permissions.has(group.permission) && (counts[group.key] ?? 0) > 0,
  ).map((group) => ({ ...group, count: counts[group.key] ?? 0 }));
}

export function notificationTotal(groups: AdminNotificationGroup[]): number {
  return groups.reduce((sum, group) => sum + group.count, 0);
}

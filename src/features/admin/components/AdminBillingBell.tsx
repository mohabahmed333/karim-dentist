"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  /** Bills sent and not yet collected. */
  count: number;
};

/**
 * The standing count of uncollected bills, in the topbar.
 *
 * The toast announces a bill once; this is what is still true afterwards. A
 * dismissed toast, a reloaded tab or a shift change all leave the count, so the
 * front desk can see at a glance that money is waiting without opening the
 * "Patients & Billing" group to find out.
 */
export function AdminBillingBell({ count }: Props) {
  const t = useTranslations();
  const waiting = count > 0;
  const label = waiting
    ? `${t("admin.billing.bellWaiting")} (${count})`
    : t("admin.billing.bellClear");

  return (
    <Link
      href="/admin/billing"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex shrink-0 rounded-md p-1.5 transition-colors",
        waiting
          ? "text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
          : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
      )}
    >
      <Bell className="size-4" aria-hidden />
      {waiting ? (
        <span
          aria-hidden
          className="absolute -end-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--admin-primary)] px-1 text-[10px] font-semibold leading-4 tabular-nums text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

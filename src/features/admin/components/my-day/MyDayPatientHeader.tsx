"use client";

import { Clock, MessageCircle, Phone, Stethoscope } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { dispatchOpenWhatsapp } from "@/features/admin/lib/adminShellEvents";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  group: PatientGroup;
  reservation: Reservation;
  canPropose: boolean;
  /** This patient's WhatsApp thread, when one exists. */
  conversationId: string | null;
  onBill: () => void;
};

/** Up to two letters, so the avatar reads as a monogram rather than a word. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]![0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function MyDayPatientHeader({
  group,
  reservation,
  canPropose,
  conversationId,
  onBill,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();

  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(reservation.starts_at));


  const meta: { Icon: typeof Phone; label: string }[] = [
    { Icon: Clock, label: time },
    ...(reservation.service_label
      ? [{ Icon: Stethoscope, label: reservation.service_label }]
      : []),
    ...(group.phone ? [{ Icon: Phone, label: group.phone }] : []),
  ];

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--admin-primary)] text-base font-semibold text-white"
      >
        {initials(group.displayName)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold tracking-tight text-[var(--admin-text)]">
          {group.displayName}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--admin-muted)]">
          {meta.map(({ Icon, label }) => (
            <span key={label} className="inline-flex min-w-0 items-center gap-1.5">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate" dir="auto">
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 ms-auto">
        {canPropose ? (
          <Button type="button" size="sm" onClick={onBill}>
            {t("admin.billing.billVisit")}
          </Button>
        ) : null}
        {/* Always the in-app panel — with an id it lands on this patient's
            thread, without one it opens the inbox. */}
        <button
          type="button"
          onClick={() =>
            dispatchOpenWhatsapp(conversationId ? { conversationId } : {})
          }
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <MessageCircle className="size-3.5" />
          {t("admin.myDay.openWhatsapp")}
        </button>
      </div>
    </header>
  );
}

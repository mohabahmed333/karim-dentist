"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { subscribeAdminLive } from "@/features/admin/lib/whatsappLiveClient";
import {
  playWhatsappInboundChime,
  unlockWhatsappInboundChime,
} from "@/features/admin/lib/whatsappInboundChime";
import { useTranslations } from "@/lib/i18n";

type Props = {
  /** Only whoever can settle a bill is told about one. */
  canCollect: boolean;
  /** Bookings still to confirm. */
  canSeeBookings?: boolean;
  /** Stock running out. */
  canSeeInventory?: boolean;
};

/**
 * Tells the front desk a doctor has billed a visit, wherever they happen to be.
 *
 * Mounted in the shell rather than on the billing page, because the person who
 * needs to know is by definition not looking at the billing page — they are on
 * the overview, or the inbox, or a patient. A toast only on /admin/billing
 * tells someone something they can already see.
 *
 * The toast does not auto-dismiss. Money owed is not a transient status
 * message; it should survive the front desk being away from the screen, which
 * is exactly when a bill is most likely to be missed.
 */
export function AdminBillingAlerts({
  canCollect,
  canSeeBookings = false,
  canSeeInventory = false,
}: Props) {
  const router = useRouter();
  const t = useTranslations();
  // Ids already announced, so a refresh or a replayed event cannot re-toast the
  // same bill on top of one the user has not dismissed.
  const announced = useRef(new Set<string>());

  useEffect(() => {
    if (!canCollect && !canSeeBookings && !canSeeInventory) return;

    // Browsers refuse audio until the user has interacted with the page.
    const unlock = () => unlockWhatsappInboundChime();
    window.addEventListener("pointerdown", unlock, { once: true });

    /** One toast per row, whatever replays or reconnects happen. */
    function announce(
      id: string,
      title: string,
      description: string,
      href: string,
    ) {
      if (announced.current.has(id)) return;
      announced.current.add(id);

      playWhatsappInboundChime();
      toast.info(title, {
        description,
        duration: Infinity,
        closeButton: true,
        action: {
          label: t("admin.bell.toastAction"),
          onClick: () => router.push(href),
        },
      });
      // Refresh whatever is on screen, so the bell moves with the toast.
      router.refresh();
    }

    const stop = subscribeAdminLive((event) => {
      if (event.eventType !== "INSERT" || !event.row) return;

      if (canCollect && event.table === "treatment_proposals") {
        if (event.row.status !== "sent") return;
        announce(
          event.row.id,
          t("admin.billing.newBillToast"),
          t("admin.billing.newBillToastHint"),
          "/admin/billing",
        );
        return;
      }

      if (canCollect && event.table === "billing_payment_requests") {
        if (event.row.status !== "pending") return;
        announce(
          event.row.id,
          t("admin.bell.paymentToast"),
          t("admin.bell.paymentToastHint"),
          "/admin/billing",
        );
        return;
      }

      if (canSeeBookings && event.table === "reservations") {
        if (event.row.status !== "pending") return;
        announce(
          event.row.id,
          t("admin.bell.pendingBookingToast"),
          t("admin.bell.pendingBookingToastHint"),
          "/admin/reservations",
        );
        return;
      }

      if (canSeeInventory && event.table === "inventory_alerts") {
        announce(
          event.row.id,
          t("admin.bell.lowStockToast"),
          t("admin.bell.lowStockToastHint"),
          "/admin/inventory",
        );
      }
    });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      stop();
    };
  }, [canCollect, canSeeBookings, canSeeInventory, router, t]);

  return null;
}

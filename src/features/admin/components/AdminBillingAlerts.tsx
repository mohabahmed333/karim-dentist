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
export function AdminBillingAlerts({ canCollect }: Props) {
  const router = useRouter();
  const t = useTranslations();
  // Ids already announced, so a refresh or a replayed event cannot re-toast the
  // same bill on top of one the user has not dismissed.
  const announced = useRef(new Set<string>());

  useEffect(() => {
    if (!canCollect) return;

    // Browsers refuse audio until the user has interacted with the page.
    const unlock = () => unlockWhatsappInboundChime();
    window.addEventListener("pointerdown", unlock, { once: true });

    const stop = subscribeAdminLive((event) => {
      if (event.table !== "treatment_proposals") return;
      if (event.eventType !== "INSERT" || !event.row) return;
      if (event.row.status !== "sent") return;
      if (announced.current.has(event.row.id)) return;
      announced.current.add(event.row.id);

      playWhatsappInboundChime();
      toast.info(t("admin.billing.newBillToast"), {
        description: t("admin.billing.newBillToastHint"),
        duration: Infinity,
        closeButton: true,
        action: {
          label: t("admin.billing.newBillToastAction"),
          onClick: () => router.push("/admin/billing"),
        },
      });
      // Refresh whatever is on screen, so the nav badge moves with the toast.
      router.refresh();
    });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      stop();
    };
  }, [canCollect, router, t]);

  return null;
}

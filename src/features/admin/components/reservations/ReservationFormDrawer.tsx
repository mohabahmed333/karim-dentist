"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PatientHistorySnippet } from "@/features/admin/components/PatientHistorySnippet";
import { ReservationDrawerSummary } from "@/features/admin/components/reservations/ReservationDrawerSummary";
import {
  reservationToForm,
  ReservationFormFields,
} from "@/features/admin/components/ReservationFormFields";
import { useAdminThemeVars } from "@/features/admin/hooks/useAdminThemeVars";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { adminThemeStyle } from "@/features/admin/lib/adminThemeVars";
import { useTranslations } from "@/lib/i18n";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { cn } from "@/lib/utils";

type Mode = "view" | "edit";

type Props = {
  open: boolean;
  values: ReservationFormValues;
  reservation?: Reservation | null;
  services: Service[];
  reservations: Reservation[];
  selectedId: string;
  pending: boolean;
  onClose: () => void;
  onChange: (values: ReservationFormValues) => void;
  onSave: () => Promise<boolean>;
  onDeleteClick: () => void;
  onStatus: (status: Reservation["status"]) => void;
};

export function ReservationFormDrawer({
  open,
  values,
  reservation,
  services,
  reservations,
  selectedId,
  pending,
  onClose,
  onChange,
  onSave,
  onDeleteClick,
  onStatus,
}: Props) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const themeVars = useAdminThemeVars(open);
  const drawer = useAdminDrawerSide();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setMode("view");
  }, [open, selectedId]);

  if (!mounted) return null;

  async function handleSave() {
    const ok = await onSave();
    if (ok) setMode("view");
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div
          className={cn("fixed inset-0 z-[200] flex", drawer.shellClass)}
          dir={drawer.shellDir}
          style={adminThemeStyle(themeVars, { surface: false })}
        >
          <motion.button
            type="button"
            aria-label={t("admin.reservations.closeDrawer")}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            dir={drawer.contentDir}
            initial={{ x: drawer.offscreenX }}
            animate={{ x: 0 }}
            exit={{ x: drawer.offscreenX }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "relative flex h-full w-full max-w-md flex-col bg-[var(--admin-panel)]",
              drawer.panelClass,
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-semibold text-[var(--admin-text)]">
                  {values.patient_name || t("admin.reservations.title")}
                </h2>
                <p className="mt-0.5 text-[12px] text-[var(--admin-muted)]">
                  {mode === "view"
                    ? t("admin.reservations.detailsTitle")
                    : t("admin.edit")}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("admin.close")}
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--admin-canvas)] p-4">
              <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
                {mode === "view" ? (
                  <ReservationDrawerSummary
                    values={values}
                    reservation={reservation}
                  />
                ) : (
                  <ReservationFormFields
                    values={values}
                    services={services}
                    pending={pending}
                    onChange={onChange}
                  />
                )}
              </div>
              <PatientHistorySnippet
                reservations={reservations}
                patientName={values.patient_name}
                phone={values.phone}
                excludeId={selectedId}
              />
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--admin-border)] bg-[var(--admin-panel)] px-4 py-3">
              {mode === "view" ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pending}
                    onClick={onDeleteClick}
                  >
                    {t("admin.delete")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending || values.status === "confirmed"}
                    onClick={() => onStatus("confirmed")}
                  >
                    {t("admin.confirm")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending || values.status === "completed"}
                    onClick={() => onStatus("completed")}
                  >
                    {t("admin.reservations.completed")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setMode("edit")}
                  >
                    {t("admin.edit")}
                  </Button>
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() => setMode("edit")}
                  >
                    {t("admin.edit")}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      if (reservation) onChange(reservationToForm(reservation));
                      setMode("view");
                    }}
                  >
                    {t("admin.cancel")}
                  </Button>
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() => void handleSave()}
                  >
                    {pending ? t("admin.saving") : t("admin.save")}
                  </Button>
                </>
              )}
            </footer>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

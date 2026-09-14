"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PatientHistorySnippet } from "@/features/admin/components/PatientHistorySnippet";
import { ReservationDrawerSummary } from "@/features/admin/components/reservations/ReservationDrawerSummary";
import {
  reservationToForm,
  ReservationFormFields,
} from "@/features/admin/components/ReservationFormFields";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { useTranslations } from "@/lib/i18n";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import type { DoctorProfile } from "@/services/profiles";

type Mode = "view" | "edit";

type Props = {
  open: boolean;
  values: ReservationFormValues;
  reservation?: Reservation | null;
  services: Service[];
  doctors?: DoctorProfile[];
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
  doctors,
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
  const [mode, setMode] = useState<Mode>("view");
  const drawer = useAdminDrawerSide();

  useEffect(() => {
    if (open) setMode("view");
  }, [open, selectedId]);

  async function handleSave() {
    const ok = await onSave();
    if (ok) setMode("view");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <SheetTitle className="truncate">
              {values.patient_name || t("admin.reservations.title")}
            </SheetTitle>
            <SheetDescription>
              {mode === "view"
                ? t("admin.reservations.detailsTitle")
                : t("admin.edit")}
            </SheetDescription>
          </div>
          <SheetClose
            render={
              <button
                type="button"
                aria-label={t("admin.close")}
                className="shrink-0 rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
              />
            }
          >
            <X className="size-4" />
          </SheetClose>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--admin-canvas)] p-4">
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
            {mode === "view" ? (
              <ReservationDrawerSummary
                values={values}
                reservation={reservation}
                doctors={doctors}
              />
            ) : (
              <ReservationFormFields
                values={values}
                services={services}
                doctors={doctors}
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

        <SheetFooter>
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
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

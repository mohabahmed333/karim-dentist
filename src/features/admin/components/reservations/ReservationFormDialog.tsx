"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PatientHistorySnippet } from "@/features/admin/components/PatientHistorySnippet";
import { ReservationFormFields } from "@/features/admin/components/ReservationFormFields";
import { useAdminThemeVars } from "@/features/admin/hooks/useAdminThemeVars";
import { adminThemeStyle } from "@/features/admin/lib/adminThemeVars";
import { useTranslations } from "@/lib/i18n";
import { formatReservationWhen } from "@/services/reservations/stats";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";

export type BookingSaveMode = "new" | "replace";

type Props = {
  open: boolean;
  values: ReservationFormValues;
  services: Service[];
  reservations: Reservation[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (values: ReservationFormValues) => void;
  onSave: () => void;
  /** Existing upcoming reservation that can be replaced */
  replaceTarget?: Reservation | null;
  saveMode?: BookingSaveMode;
  onSaveModeChange?: (mode: BookingSaveMode) => void;
};

export function ReservationFormDialog({
  open,
  values,
  services,
  reservations,
  pending,
  onOpenChange,
  onChange,
  onSave,
  replaceTarget = null,
  saveMode = "new",
  onSaveModeChange,
}: Props) {
  const t = useTranslations();
  const themeVars = useAdminThemeVars(open);
  const showModeChoice = Boolean(replaceTarget && onSaveModeChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-showreel-action="reservation-form-modal"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        style={adminThemeStyle(themeVars)}
      >
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">
            {t("admin.reservations.new")}
          </DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            {t("admin.reservations.createDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {showModeChoice && replaceTarget ? (
            <div className="space-y-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)]/30 p-3">
              <p className="text-xs font-medium text-[var(--admin-text)]">
                {t("admin.reservations.existingFound")}
              </p>
              <p className="text-[11px] text-[var(--admin-muted)]">
                <ReservationServiceLabel
                  serviceId={replaceTarget.service_id}
                  storedLabel={replaceTarget.service_label}
                  services={services}
                />{" "}
                · {formatReservationWhen(replaceTarget.starts_at)}
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <ModeOption
                  selected={saveMode === "replace"}
                  onSelect={() => onSaveModeChange?.("replace")}
                  title={t("admin.reservations.replaceExisting")}
                  description={t("admin.reservations.replaceExistingDesc")}
                />
                <ModeOption
                  selected={saveMode === "new"}
                  onSelect={() => onSaveModeChange?.("new")}
                  title={t("admin.reservations.createNew")}
                  description={t("admin.reservations.createNewDesc")}
                />
              </div>
            </div>
          ) : null}

          <ReservationFormFields
            values={values}
            services={services}
            pending={pending}
            onChange={onChange}
          />
          <PatientHistorySnippet
            reservations={reservations}
            patientName={values.patient_name}
            phone={values.phone}
            excludeId={
              saveMode === "replace" ? replaceTarget?.id : undefined
            }
          />
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
          <Button
            type="button"
            data-showreel-action="reservation-create"
            disabled={pending}
            onClick={onSave}
          >
            {pending
              ? t("admin.saving")
              : saveMode === "replace" && replaceTarget
                ? t("admin.reservations.update")
                : t("admin.reservations.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-md border px-3 py-2 text-left transition-colors",
        selected
          ? "border-[var(--admin-primary)] bg-[var(--admin-panel)] ring-1 ring-[var(--admin-primary)]"
          : "border-[var(--admin-border)] bg-[var(--admin-panel)] hover:bg-[var(--admin-hover)]",
      )}
    >
      <span className="block text-xs font-semibold text-[var(--admin-text)]">
        {title}
      </span>
      <span className="mt-0.5 block text-[11px] text-[var(--admin-muted)]">
        {description}
      </span>
    </button>
  );
}

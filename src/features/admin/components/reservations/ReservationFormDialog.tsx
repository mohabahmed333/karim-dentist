"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import {
  PatientPickerStep,
  type ChosenPatient,
} from "@/features/admin/components/reservations/PatientPickerStep";
import { useTranslations } from "@/lib/i18n";
import { formatReservationWhen } from "@/services/reservations/stats";
import type {
  ReservationFieldErrors,
  ReservationFormValues,
} from "@/services/reservations/schemas";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import type { DoctorProfile } from "@/services/profiles";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";

export type BookingSaveMode = "new" | "replace";

type Props = {
  open: boolean;
  values: ReservationFormValues;
  services: Service[];
  doctors?: DoctorProfile[];
  reservations: Reservation[];
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (values: ReservationFormValues) => void;
  onSave: () => void;
  /** Existing upcoming reservation that can be replaced */
  replaceTarget?: Reservation | null;
  saveMode?: BookingSaveMode;
  onSaveModeChange?: (mode: BookingSaveMode) => void;
  errors?: ReservationFieldErrors;
};

export function ReservationFormDialog({
  open,
  values,
  services,
  doctors,
  reservations,
  pending,
  onOpenChange,
  onChange,
  onSave,
  replaceTarget = null,
  saveMode = "new",
  onSaveModeChange,
  errors,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const showModeChoice = Boolean(replaceTarget && onSaveModeChange);
  const [step, setStep] = useState<"patient" | "details">("details");
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (!open) return;
    // A brand-new, never-touched form (no patient linked yet, nothing typed)
    // starts at the patient step. Anything already identified — editing an
    // existing reservation, or a prefilled quick-book/reception link — skips
    // straight to the booking details.
    const freshNew =
      !values.patient_id && !values.patient_name.trim() && !values.phone.trim();
    setStep(freshNew ? "patient" : "details");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only decide the step when the dialog opens, not on every value change
  }, [open]);

  function handlePatientChosen(patient: ChosenPatient) {
    onChange({
      ...values,
      patient_id: patient.id,
      patient_name: patient.display_name,
      phone: patient.phone,
      email: patient.email ?? "",
    });
    setDirection(1);
    setStep("details");
  }

  function goBackToPatientStep() {
    setDirection(-1);
    setStep("patient");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-showreel-action="reservation-form-modal"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">
            {t("admin.reservations.new")}
          </DialogTitle>
          {step === "details" ? (
            <DialogDescription className="text-[var(--admin-muted)]">
              {t("admin.reservations.createDesc")}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex shrink-0 items-center gap-2 px-4 pb-3">
          <StepBadge index={1} label={t("admin.reservations.stepPatient")} active={step === "patient"} done={step === "details"} />
          <div className="h-px flex-1 bg-[var(--admin-border)]" />
          <StepBadge index={2} label={t("admin.reservations.stepDetails")} active={step === "details"} done={false} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={reduced ? false : { opacity: 0, x: direction * 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -direction * 16 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="space-y-4"
            >
          {step === "patient" ? (
            <PatientPickerStep onPatientChosen={handlePatientChosen} />
          ) : (
            <>
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
                doctors={doctors}
                pending={pending}
                onChange={onChange}
                errors={errors}
              />
              <PatientHistorySnippet
                reservations={reservations}
                patientName={values.patient_name}
                phone={values.phone}
                excludeId={
                  saveMode === "replace" ? replaceTarget?.id : undefined
                }
              />
            </>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step === "details" ? (
          <DialogFooter className="m-0 shrink-0 rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={goBackToPatientStep}
            >
              {t("admin.reservations.backToPatient")}
            </Button>
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
        ) : null}
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

function StepBadge({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium",
        active
          ? "bg-[var(--admin-primary)] text-white"
          : done
            ? "text-[var(--admin-text)]"
            : "text-[var(--admin-muted)]",
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full text-[10px]",
          active
            ? "bg-white/20"
            : done
              ? "bg-[var(--admin-primary)] text-white"
              : "border border-[var(--admin-border)]",
        )}
      >
        {index}
      </span>
      {label}
    </span>
  );
}

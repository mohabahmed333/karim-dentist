"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createPatientSchema,
  type PatientProfileUpsertValues,
} from "@/services/patient_profiles/schemas";
import { createPatient } from "@/services/patient_profiles/actions";
import type { PatientProfile } from "@/services/patient_profiles/types";
import { ClientProfileForm } from "./workspace/ClientProfileForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patient: PatientProfile) => void;
};

const EMPTY_FORM: PatientProfileUpsertValues = {
  display_name: "",
  phone: "",
  email: null,
  date_of_birth: null,
  age_years: null,
  gender: "",
  medical_history: [],
  allergies: [],
  medications: "",
  notes: "",
};

type FieldErrors = Partial<Record<keyof PatientProfileUpsertValues, string>>;

export function AddPatientDialog({ open, onOpenChange, onCreated }: Props) {
  const t = useTranslations();
  const [form, setForm] = useState<PatientProfileUpsertValues>(EMPTY_FORM);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleFormChange(next: PatientProfileUpsertValues) {
    setForm(next);
    if (Object.keys(errors).length > 0) setErrors({});
  }

  async function save() {
    const parsed = createPatientSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof PatientProfileUpsertValues | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(t("admin.patients.toasts.fillRequiredFields"));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const created = await createPatient(parsed.data);
      toast.success(t("admin.patients.toasts.patientAdded"));
      setForm(EMPTY_FORM);
      onCreated(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.patients.toasts.couldNotAddPatient"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setForm(EMPTY_FORM);
          setErrors({});
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-showreel-action="add-patient-modal"
        className="flex max-h-[90vh] origin-bottom flex-col gap-0 overflow-hidden p-0 duration-200 data-open:zoom-in-75 data-open:slide-in-from-bottom-6 data-closed:zoom-out-75 data-closed:slide-out-to-bottom-6 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">{t("admin.patients.addDialog.title")}</DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            {t("admin.patients.addDialog.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ClientProfileForm value={form} onChange={handleFormChange} errors={errors} />
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
          <Button
            type="button"
            data-showreel-action="add-patient-submit"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? t("admin.patients.addDialog.adding") : t("admin.patients.addDialog.title")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

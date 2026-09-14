"use client";

import { useState } from "react";
import { toast } from "sonner";
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
  patientProfileUpsertSchema,
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

export function AddPatientDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<PatientProfileUpsertValues>(EMPTY_FORM);
  const [pending, setPending] = useState(false);

  async function save() {
    const parsed = patientProfileUpsertSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid profile");
      return;
    }
    if (!parsed.data.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    setPending(true);
    try {
      const created = await createPatient(parsed.data);
      toast.success("Patient added");
      setForm(EMPTY_FORM);
      onCreated(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add patient");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setForm(EMPTY_FORM);
        onOpenChange(next);
      }}
    >
      <DialogContent
        data-showreel-action="add-patient-modal"
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle className="text-[var(--admin-text)]">Add patient</DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            Create a new patient record.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ClientProfileForm value={form} onChange={setForm} />
        </div>

        <DialogFooter className="m-0 shrink-0 rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
          <Button
            type="button"
            data-showreel-action="add-patient-submit"
            disabled={pending}
            onClick={() => void save()}
          >
            {pending ? "Adding…" : "Add patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

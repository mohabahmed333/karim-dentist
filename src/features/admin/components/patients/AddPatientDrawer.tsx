"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  patientProfileUpsertSchema,
  type PatientProfileUpsertValues,
} from "@/services/patient_profiles/schemas";
import { createPatient } from "@/services/patient_profiles/actions";
import { SideDrawer } from "./treatments/SideDrawer";
import { ClientProfileForm } from "./workspace/ClientProfileForm";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (patientKey: string) => void;
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

export function AddPatientDrawer({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<PatientProfileUpsertValues>(EMPTY_FORM);
  const [pending, setPending] = useState(false);

  function handleClose() {
    setForm(EMPTY_FORM);
    onClose();
  }

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
      onCreated(created.patient_key);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add patient");
    } finally {
      setPending(false);
    }
  }

  return (
    <SideDrawer open={open} title="Add patient" onClose={handleClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ClientProfileForm value={form} onChange={setForm} />
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#E8EAED] px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#70758A]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void save()}
            className="rounded-lg bg-[#111111] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            {pending ? "Adding…" : "Add patient"}
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}

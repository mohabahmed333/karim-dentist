"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  emptyPatientProfile,
  getPatientProfile,
  patientProfileUpsertSchema,
  upsertPatientProfile,
  type PatientProfileUpsertValues,
} from "@/services/patient_profiles";
import { SideDrawer } from "../treatments/SideDrawer";
import { ClientProfileForm } from "./ClientProfileForm";

type Props = {
  open: boolean;
  patientKey: string;
  displayName: string;
  phone: string;
  email: string | null;
  onClose: () => void;
};

function toForm(
  patientKey: string,
  seed: { displayName: string; phone: string; email: string | null },
  row: Awaited<ReturnType<typeof getPatientProfile>>,
): PatientProfileUpsertValues {
  const base = emptyPatientProfile(patientKey, seed);
  const src = row ?? base;
  return {
    display_name: src.display_name || seed.displayName,
    phone: src.phone || seed.phone,
    email: src.email ?? seed.email,
    date_of_birth: src.date_of_birth,
    age_years: src.age_years,
    gender: src.gender,
    medical_history: src.medical_history ?? [],
    allergies: src.allergies ?? [],
    medications: src.medications ?? "",
    notes: src.notes ?? "",
  };
}

export function ClientProfileDrawer({
  open,
  patientKey,
  displayName,
  phone,
  email,
  onClose,
}: Props) {
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PatientProfileUpsertValues>(() =>
    toForm(patientKey, { displayName, phone, email }, null),
  );
  const [snapshot, setSnapshot] = useState<PatientProfileUpsertValues | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setEditing(false);
    setLoading(true);
    void getPatientProfile(patientKey)
      .then((row) => {
        if (!alive) return;
        const next = toForm(patientKey, { displayName, phone, email }, row);
        setForm(next);
        setSnapshot(next);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open, patientKey, displayName, phone, email]);

  function startEdit() {
    setSnapshot(form);
    setEditing(true);
  }

  function cancelEdit() {
    if (snapshot) setForm(snapshot);
    setEditing(false);
  }

  async function save() {
    const parsed = patientProfileUpsertSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid profile");
      return;
    }
    setPending(true);
    try {
      await upsertPatientProfile(patientKey, parsed.data);
      const saved = { ...form, ...parsed.data };
      setForm(saved);
      setSnapshot(saved);
      setEditing(false);
      toast.success("Client profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <SideDrawer open={open} title="Client profile" onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 text-[12px] text-[#9CA3AF]">Loading…</p>
          ) : (
            <ClientProfileForm
              value={form}
              onChange={setForm}
              readOnly={!editing}
            />
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#E8EAED] px-5 py-3">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#70758A]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || loading}
                onClick={() => void save()}
                className="rounded-lg bg-[#111111] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
              >
                {pending ? "Saving…" : "Save profile"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#70758A]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={startEdit}
                className="rounded-lg bg-[#111111] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}

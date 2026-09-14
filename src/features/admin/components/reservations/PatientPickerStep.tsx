"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPatients } from "@/services/patient_profiles/queries";
import type {
  PatientProfile,
  PatientSearchResult,
} from "@/services/patient_profiles/types";
import { AddPatientDialog } from "@/features/admin/components/patients/AddPatientDialog";

export type ChosenPatient = {
  id: string;
  display_name: string;
  phone: string;
  email: string | null;
};

type Props = {
  onPatientChosen: (patient: ChosenPatient) => void;
};

export function PatientPickerStep({ onPatientChosen }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      void searchPatients(term)
        .then((rows) => {
          if (requestId.current === id) setResults(rows);
        })
        .catch(() => {
          if (requestId.current === id) setResults([]);
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  function handleCreated(patient: PatientProfile) {
    setAddOpen(false);
    onPatientChosen({
      id: patient.id,
      display_name: patient.display_name,
      phone: patient.phone,
      email: patient.email,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2">
        <Search className="size-4 shrink-0 text-[var(--admin-muted)]" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name or phone…"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <ul className="max-h-64 divide-y divide-[var(--admin-border)] overflow-y-auto rounded-lg border border-[var(--admin-border)]">
        {loading ? (
          <li className="px-3 py-3 text-sm text-[var(--admin-muted)]">Searching…</li>
        ) : query.trim() && results.length === 0 ? (
          <li className="px-3 py-3 text-sm text-[var(--admin-muted)]">
            No matching patients
          </li>
        ) : (
          results.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-start text-sm hover:bg-[var(--admin-hover)]"
                onClick={() => onPatientChosen(patient)}
              >
                <span className="block font-medium text-[var(--admin-text)]">
                  {patient.display_name || "Unnamed"}
                </span>
                <span className="block text-xs text-[var(--admin-muted)]">
                  {patient.phone}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <button
        type="button"
        className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
        onClick={() => setAddOpen(true)}
      >
        + Add new patient
      </button>

      <AddPatientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

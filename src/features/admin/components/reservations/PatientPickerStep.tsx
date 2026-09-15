"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CornerDownLeft, Plus, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const term = query.trim();
    setActive(0);
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

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = results[active];
      if (hit) onPatientChosen(hit);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--admin-border)]">
      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
        <Search className="size-4 shrink-0 text-[var(--admin-muted)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKey}
          placeholder="Search patients by name or phone…"
          className="h-7 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--admin-muted)]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex size-5 items-center justify-center rounded-md bg-[var(--admin-muted)] text-white"
            aria-label="Clear"
          >
            <X className="size-3" />
          </button>
        ) : (
          <CornerDownLeft className="size-3.5 text-[var(--admin-muted)]" />
        )}
      </div>

      <div className="max-h-64 overflow-y-auto py-2">
        {loading ? (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--admin-muted)]">
            Searching…
          </p>
        ) : query.trim() && results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--admin-muted)]">
            No matching patients
          </p>
        ) : results.length > 0 ? (
          <ul>
            {results.map((patient, index) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onPatientChosen(patient)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[13px]",
                    index === active
                      ? "bg-[var(--admin-hover)]"
                      : "hover:bg-[var(--admin-hover)]",
                  )}
                >
                  <User className="size-4 shrink-0 text-[var(--admin-muted)]" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {patient.display_name || "Unnamed"}
                  </span>
                  <span className="hidden max-w-[40%] truncate text-[12px] text-[var(--admin-muted)] sm:inline">
                    {patient.phone}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--admin-muted)]">
            Type a name or phone to search
          </p>
        )}
      </div>

      <button
        type="button"
        className="flex w-full items-center gap-2.5 border-t border-[var(--admin-border)] px-3 py-2.5 text-start text-[13px] font-medium text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="size-4 shrink-0" />
        Add new patient
      </button>

      <AddPatientDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}

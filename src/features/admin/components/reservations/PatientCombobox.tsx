"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { searchPatients } from "@/services/patient_profiles/queries";
import type { PatientSearchResult } from "@/services/patient_profiles/types";

type Props = {
  /** The text to search by — typically the Patient name field's current value. */
  query: string;
  open: boolean;
  onSelect: (patient: PatientSearchResult) => void;
};

/** Dropdown of matching patients, positioned under whatever input drives `query`. */
export function PatientCombobox({ query, open, onSelect }: Props) {
  const t = useTranslations();
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const term = query.trim();

  useEffect(() => {
    if (!open || !term) {
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
  }, [open, term]);

  if (!open || !term) return null;

  return (
    <ul
      role="listbox"
      className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black/5"
    >
      {loading ? (
        <li className="px-3 py-2 text-sm text-[#9ca3af]">
          {t("admin.reservations.searchingPatients")}
        </li>
      ) : results.length === 0 ? (
        <li className="px-3 py-2 text-sm text-[#9ca3af]">
          {t("admin.reservations.noMatchingPatients")}
        </li>
      ) : (
        results.map((patient) => (
          <li key={patient.id} role="option">
            <button
              type="button"
              className="w-full px-3 py-2 text-start text-sm hover:bg-[#f2f2f2]"
              onClick={() => onSelect(patient)}
            >
              <span className="block font-medium text-[#111827]">
                {patient.display_name || "Unnamed"}
              </span>
              <span className="block text-xs text-[#6b7280]">{patient.phone}</span>
            </button>
          </li>
        ))
      )}
    </ul>
  );
}

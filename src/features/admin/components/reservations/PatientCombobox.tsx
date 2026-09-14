"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPatients } from "@/services/patient_profiles/queries";
import type { PatientSearchResult } from "@/services/patient_profiles/types";

type Props = {
  disabled?: boolean;
  onSelect: (patient: PatientSearchResult) => void;
};

export function PatientCombobox({ disabled, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-3 py-2">
        <Search className="size-3.5 text-[#9ca3af]" />
        <Input
          autoFocus
          disabled={disabled}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
        {loading ? (
          <li className="px-3 py-2 text-sm text-[#9ca3af]">Searching…</li>
        ) : query.trim() && results.length === 0 ? (
          <li className="px-3 py-2 text-sm text-[#9ca3af]">No matching patients</li>
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
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  patientProfilePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";

type Props = {
  directory: PatientGroup[];
  currentKey: string;
};

export function PatientSearchPill({ directory, currentKey }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return directory
      .filter((group) => group.patientKey !== currentKey)
      .filter((group) =>
        `${group.displayName} ${group.phone}`.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [currentKey, directory, query]);

  return (
    <div className="relative w-full max-w-[240px]">
      <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-[#8a8a8a]" />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search patient..."
        aria-label="Search patient"
        className="h-11 w-full rounded-full bg-[#f2f2f2] pe-4 ps-10 text-[13px] text-[#111111] outline-none placeholder:text-[#8a8a8a]"
      />
      {matches.length > 0 ? (
        <ul className="absolute top-full end-0 start-0 z-30 mt-2 overflow-hidden rounded-2xl bg-white py-1">
          {matches.map((group) => (
            <li key={group.patientKey}>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-start text-sm text-[#111111] hover:bg-[#EBEAE5]"
                onClick={() => {
                  router.push(patientProfilePath(group.patientKey));
                  setQuery("");
                }}
              >
                {group.displayName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

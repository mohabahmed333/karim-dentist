"use client";

import type { Treatment } from "./types";

type Props = {
  treatments: Treatment[];
};

function SeverityBadge({ severity }: { severity: Treatment["severity"] }) {
  const classes =
    severity === "Critical"
      ? "bg-red-500 text-white"
      : "bg-yellow-400 text-[#111827]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {severity}
    </span>
  );
}

export function TreatmentTable({ treatments }: Props) {
  return (
    <section
      aria-label="Treatment list"
      className="rounded-xl border border-[#e5e7eb] bg-white p-4"
    >
      <h2 className="mb-3 text-sm font-semibold text-[#111827]">Treatments</h2>
      {treatments.length === 0 ? (
        <p className="text-sm text-[#6b7280]">No treatments charted yet.</p>
      ) : (
        <ul className="divide-y divide-[#e5e7eb]">
          {treatments.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div
                className="h-8 w-8 shrink-0 rounded bg-[#e5e7eb]"
                aria-hidden
                title="X-ray placeholder"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#111827]">
                  Tooth {tx.tooth} · {tx.cdtCode}
                </p>
                <p className="truncate text-xs text-[#6b7280]">{tx.procedureName}</p>
              </div>
              <SeverityBadge severity={tx.severity} />
              <span className="shrink-0 text-sm font-medium text-[#111827]">
                ${tx.fee}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import type { QueueRow } from "./clinicalTypes";

type Props = {
  rows: QueueRow[];
  onBook?: (id: string) => void;
};

function badgeClass(row: QueueRow): string {
  if (row.status === "scheduled" || row.status === "done") {
    return "bg-green-100 text-green-800";
  }
  if (row.severity === "Critical") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-900";
}

function badgeLabel(row: QueueRow): string {
  if (row.status === "scheduled") return "Booked";
  if (row.status === "done") return "Done";
  return row.severity;
}

export function QueuePanel({ rows, onBook }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
        Required treatments
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[#6b7280]">No treatments in the queue.</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#111827]">
                    {row.toothLabel}
                  </p>
                  <p className="truncate text-xs text-[#6b7280]">
                    {row.cdtCode ? `${row.cdtCode} · ` : ""}
                    {row.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass(row)}`}
                >
                  {badgeLabel(row)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                {row.status === "scheduled" ? (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-800">
                    Date booked
                  </span>
                ) : (
                  <span className="text-[10px] text-[#9ca3af]">Not booked</span>
                )}
                <button
                  type="button"
                  onClick={() => onBook?.(row.id)}
                  className="rounded-full bg-[#2563eb] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  Book Now
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

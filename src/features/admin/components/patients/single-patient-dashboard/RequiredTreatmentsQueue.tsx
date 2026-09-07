"use client";

import type { QueueRow } from "./clinicalTypes";

type Props = {
  rows: QueueRow[];
};

function badgeClass(row: QueueRow): string {
  if (row.status === "scheduled" || row.status === "done") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (row.severity === "Critical") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-900";
}

function badgeLabel(row: QueueRow): string {
  if (row.status === "scheduled") return "Confirmed";
  if (row.status === "done") return "Done";
  return row.severity;
}

export function RequiredTreatmentsQueue({ rows }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Required treatments
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No planned treatments. Select a tooth and use a quick CDT action.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex gap-1">
                {row.imageUrls.length > 0 ? (
                  row.imageUrls.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-9 w-9 rounded object-cover"
                    />
                  ))
                ) : (
                  <div
                    className="h-9 w-9 rounded bg-slate-100"
                    aria-hidden
                    title="No imaging"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {row.toothLabel}
                  {row.cdtCode ? ` · ${row.cdtCode}` : ""}
                </p>
                <p className="truncate text-xs text-slate-500">{row.description}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass(row)}`}
              >
                {badgeLabel(row)}
              </span>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 hover:border-slate-900 hover:text-slate-900"
              >
                Book
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

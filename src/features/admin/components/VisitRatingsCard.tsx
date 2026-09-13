"use client";

import { useCallback, useEffect, useState } from "react";
import { PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { RatingRow } from "@/services/visit_ratings/queries";
import { AdminSkeleton } from "./AdminSkeleton";

const when = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(iso));

/** 1–3 is a call; the colour says so at a glance. */
function Score({ rating }: { rating: number }) {
  const low = rating <= 3;
  return (
    <span
      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
        low
          ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#B91C1C]"
          : "border-[#86EFAC] bg-[#F0FDF4] text-[#15803D]"
      }`}
    >
      {rating}
    </span>
  );
}

/**
 * Patients who scored a visit badly and have not been rung yet.
 *
 * A low score is a job rather than a statistic, so this is a work list: it
 * empties as people are called, and the review link goes out to them two days
 * later whether or not anyone did — which is the point of keeping it visible.
 */
export function VisitRatingsCard() {
  const [rows, setRows] = useState<RatingRow[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/visit-ratings");
    if (!res.ok) throw new Error("failed");
    return ((await res.json()) as { ratings: RatingRow[] }).ratings;
  }, []);

  useEffect(() => {
    let alive = true;
    void load()
      .then((next) => alive && setRows(next))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [load]);

  async function markCalled(id: string) {
    setPending(id);
    try {
      const res = await fetch(`/api/v1/visit-ratings/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? "Failed");
      setRows((current) => (current ?? []).filter((r) => r.id !== id));
      toast.success("Marked as called");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(null);
    }
  }

  if (rows === null) return <AdminSkeleton className="h-32 w-full rounded-lg" />;

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Visits that scored badly</h3>
        <span className="text-xs tabular-nums text-[var(--admin-muted)]">
          {rows.length} to call
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-border)] px-4 py-6 text-center text-sm text-[var(--admin-muted)]">
          Nobody is waiting for a call.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 border-b border-[var(--admin-border)] px-3 py-2.5 last:border-b-0"
            >
              <Score rating={row.rating} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {row.patientName || row.phone}
                  {row.serviceLabel ? (
                    <span className="text-[var(--admin-muted)]"> · {row.serviceLabel}</span>
                  ) : null}
                </p>
                {row.comment ? (
                  <p className="truncate text-xs text-[var(--admin-muted)]">“{row.comment}”</p>
                ) : null}
              </div>
              <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                {when(row.createdAt)}
              </span>
              <a
                href={`tel:${row.phone}`}
                className="shrink-0 text-xs text-[var(--admin-primary)] underline"
              >
                {row.phone}
              </a>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending === row.id}
                onClick={() => void markCalled(row.id)}
              >
                <PhoneCall aria-hidden className="size-3.5" />
                Called
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

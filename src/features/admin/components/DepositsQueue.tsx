"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DepositQueueRow } from "@/services/deposits/queries";
import { AdminSkeleton } from "./AdminSkeleton";
import { DepositReceiptCard } from "./DepositReceiptCard";

const FILTERS = [
  { key: "in_review", label: "Waiting for you" },
  { key: "awaiting_receipt", label: "Waiting for the patient" },
  { key: "paid", label: "Paid" },
  { key: "", label: "All" },
] as const;

export function DepositsQueue() {
  const [status, setStatus] = useState<string>("in_review");
  // Keyed by the filter it belongs to, so switching filters shows the skeleton
  // without a synchronous setState inside the effect.
  const [loaded, setLoaded] = useState<{ status: string; rows: DepositQueueRow[] } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async (next: string) => {
    const query = next ? `?status=${next}` : "";
    const res = await fetch(`/api/v1/deposits${query}`);
    if (!res.ok) throw new Error("Could not load deposits");
    const body = (await res.json()) as { deposits: DepositQueueRow[] };
    return body.deposits;
  }, []);

  useEffect(() => {
    let alive = true;
    void load(status)
      .then((next) => {
        if (alive) setLoaded({ status, rows: next });
      })
      .catch(() => {
        if (alive) {
          setLoaded({ status, rows: [] });
          toast.error("Could not load deposits");
        }
      });
    return () => {
      alive = false;
    };
  }, [load, status]);

  const rows = loaded?.status === status ? loaded.rows : null;

  async function decide(id: string, action: "confirm" | "reject") {
    setPending(id);
    try {
      const res = await fetch(`/api/v1/deposits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reasons[id] ?? "" }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not apply");
      // Drop it from the list rather than refetching: staff work down a queue,
      // and a reordering jump loses their place.
      setLoaded((current) =>
        current ? { ...current, rows: current.rows.filter((row) => row.id !== id) } : current,
      );
      toast.success(action === "confirm" ? "Deposit confirmed" : "Deposit rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not apply");
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.key || "all"}
            type="button"
            size="sm"
            variant={status === filter.key ? "default" : "outline"}
            onClick={() => setStatus(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {rows === null ? (
        <div className="space-y-2">
          <AdminSkeleton className="h-40 w-full rounded-lg" />
          <AdminSkeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-border,#e5e7eb)] px-4 py-8 text-center text-sm text-[var(--admin-muted)]">
          Nothing here.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <DepositReceiptCard row={row}>
                {row.status === "in_review" || row.status === "awaiting_receipt" ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--admin-border,#e5e7eb)] px-3 py-2">
                    <Input
                      value={reasons[row.id] ?? ""}
                      placeholder="Reason (optional, kept on the record)"
                      className="h-8 min-w-0 flex-1"
                      onChange={(e) =>
                        setReasons((current) => ({ ...current, [row.id]: e.target.value }))
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending === row.id}
                      onClick={() => void decide(row.id, "confirm")}
                    >
                      Confirm
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending === row.id}
                      onClick={() => void decide(row.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </DepositReceiptCard>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-3 py-2 text-xs text-[#92400E]">
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          A screenshot is a picture of a claim, not proof of payment. The checks here stop a receipt
          being used twice and catch an amount or recipient that is wrong, but a well-made forgery
          will pass. Reconcile against the clinic&apos;s own statement before treating a busy day&apos;s
          deposits as money in hand.
        </span>
      </p>
    </section>
  );
}

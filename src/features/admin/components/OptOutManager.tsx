"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tables } from "@/lib/supabase/database.types";

type OptOut = Pick<Tables<"patient_notification_optouts">, "phone_suffix" | "phone" | "reason" | "created_at">;

async function fetchOptOuts(): Promise<OptOut[]> {
  const res = await fetch("/api/v1/notifications/optouts");
  if (!res.ok) throw new Error("load failed");
  const data = (await res.json()) as { optouts?: OptOut[] };
  return data.optouts ?? [];
}

/**
 * Numbers the clinic must not message. Patients texting STOP or إيقاف are added
 * automatically; staff can add someone who asked on the phone.
 */
export function OptOutManager() {
  const [rows, setRows] = useState<OptOut[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchOptOuts()
      .then((next) => {
        if (alive) setRows(next);
      })
      .catch(() => {
        if (alive) setRows([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setPending(true);
    try {
      const res = await fetch("/api/v1/notifications/optouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? ""),
          reason: String(form.get("reason") ?? "") || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(body.error ?? "Could not add");
        return;
      }
      formEl.reset();
      setRows(await fetchOptOuts());
      toast.success("Opted out — anything already queued for them was withdrawn");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(suffix: string) {
    const res = await fetch(`/api/v1/notifications/optouts/${suffix}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not remove");
      return;
    }
    setRows((prev) => (prev ?? []).filter((r) => r.phone_suffix !== suffix));
    toast.success("They can be messaged again");
  }

  return (
    <div className="space-y-3">
      <form className="flex flex-wrap gap-2" onSubmit={(e) => void onAdd(e)}>
        <Input name="phone" required placeholder="+20 100 000 0000" className="w-48" />
        <Input name="reason" placeholder="Reason (optional)" className="w-56" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Opt out"}
        </Button>
      </form>

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody has opted out.</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map((row) => (
            <li key={row.phone_suffix} className="flex items-center justify-between gap-3 py-2">
              <div>
                <div>{row.phone || `…${row.phone_suffix}`}</div>
                <div className="text-xs text-muted-foreground">
                  {row.reason || "no reason given"} · {new Date(row.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void onRemove(row.phone_suffix)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

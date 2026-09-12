"use client";

import { toast } from "sonner";
import type { ActionDiff, ProposedAction } from "@/services/admin_ai";
import type { ProposalReviewState } from "./ActionReviewCard";
import { hrefForNavAction } from "@/services/admin_ai/navHref";
import { isWriteActionKind } from "@/services/admin_ai/writeKinds";

export async function proposeFromChat(input: {
  source: "clinic-chat" | "treatment-chat";
  patientKey?: string | null;
  summary: string;
  actions: ProposedAction[];
  /** Client-side navigation (e.g. `router.push`). Defaults to a full page load. */
  navigate?: (href: string) => void;
}): Promise<ProposalReviewState | null> {
  const writes = input.actions.filter((a) => isWriteActionKind(a.kind));
  const nav = input.actions.filter((a) => !isWriteActionKind(a.kind));

  // Several navigations in one reply can only end on one page: take the last.
  const target = nav
    .map((action) => hrefForNavAction(action, input.patientKey))
    .filter((href): href is string => Boolean(href))
    .at(-1);
  if (target) {
    (input.navigate ?? ((href: string) => window.location.assign(href)))(target);
  }

  if (writes.length === 0) return null;

  const res = await fetch("/api/v1/ai/admin-actions/propose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: input.source,
      patientKey: input.patientKey ?? null,
      summary: input.summary,
      actions: writes,
    }),
  });
  const body = (await res.json()) as {
    proposalId?: string;
    summary?: string;
    diffs?: ActionDiff[];
    actions?: ProposedAction[];
    expiresAt?: string;
    error?: string;
  };
  if (!res.ok) {
    toast.error(body.error ?? "Could not build proposal");
    return null;
  }
  if (!body.proposalId || !body.diffs) {
    toast.error("Invalid proposal response");
    return null;
  }
  return {
    proposalId: body.proposalId,
    summary: body.summary ?? input.summary,
    diffs: body.diffs,
    actions: body.actions ?? writes,
    expiresAt: body.expiresAt,
  };
}

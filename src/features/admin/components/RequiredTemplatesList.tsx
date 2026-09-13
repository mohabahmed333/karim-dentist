import { TemplateProposalCard } from "./TemplateProposalCard";
import {
  tallyTemplates,
  type RequiredTemplate,
} from "@/services/patient_notifications/requiredTemplates";
import { TEMPLATE_PROPOSALS } from "@/services/patient_notifications/templateProposals";

const BADGE: Record<RequiredTemplate["status"], { label: string; className: string }> = {
  approved: {
    label: "Approved",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  },
  missing: {
    label: "Not in Meta",
    className: "border-red-500/40 bg-red-500/10 text-red-600",
  },
  not_submitted: {
    label: "Not submitted",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  },
  unknown: {
    label: "Unknown",
    className: "border-[var(--admin-border)] bg-[var(--admin-hover)] text-[var(--admin-muted)]",
  },
};

function Badge({ status }: { status: RequiredTemplate["status"] }) {
  const badge = BADGE[status];
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

/**
 * Every template the clinic needs, and whether Meta has it.
 *
 * Server-rendered from one pure function, so the page cannot disagree with the
 * readiness checklist about what is missing — both read the same two lists.
 */
export function RequiredTemplatesList({
  rows,
  reachedMeta,
}: {
  rows: RequiredTemplate[];
  reachedMeta: boolean;
}) {
  const tally = tallyTemplates(rows);

  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)] px-3.5 py-2.5 text-sm text-[var(--admin-muted)]">
        {reachedMeta ? (
          <>
            {tally.approved} of {rows.length} approved in Meta.{" "}
            {tally.missing > 0
              ? `${tally.missing} are used by the app but Meta does not list them — those sends will fail. `
              : ""}
            {tally.not_submitted > 0
              ? `${tally.not_submitted} have never been submitted; their text is below.`
              : ""}
          </>
        ) : (
          <>
            Meta could not be asked, so approval is unknown. Check
            KAPSO_API_KEY and KAPSO_BUSINESS_ACCOUNT_ID.
          </>
        )}
      </p>

      <ul className="divide-y divide-[var(--admin-border)] rounded-lg border border-[var(--admin-border)]">
        {rows.map((row) => (
          <li
            key={`${row.name}:${row.bodyLanguage}`}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{row.title}</p>
              <p className="truncate font-mono text-[11px] text-[var(--admin-muted)]">
                {row.name} · {row.bodyLanguage === "ar" ? "Arabic body" : "English body"}
              </p>
            </div>
            <Badge status={row.status} />
          </li>
        ))}
      </ul>

      {tally.not_submitted > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
            Text to submit
          </p>
          {TEMPLATE_PROPOSALS.map((proposal) => (
            <TemplateProposalCard key={proposal.kind} proposal={proposal} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

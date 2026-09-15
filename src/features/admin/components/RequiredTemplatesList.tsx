"use client";

import { TemplateProposalCard } from "./TemplateProposalCard";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import {
  tallyTemplates,
  type RequiredTemplate,
} from "@/services/patient_notifications/requiredTemplates";
import { TEMPLATE_PROPOSALS } from "@/services/patient_notifications/templateProposals";

const BADGE_KEYS: Record<RequiredTemplate["status"], { labelKey: AdminMessageKey; className: string }> = {
  approved: {
    labelKey: "admin.pages.templates.approved",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  },
  missing: {
    labelKey: "admin.pages.templates.notInMeta",
    className: "border-red-500/40 bg-red-500/10 text-red-600",
  },
  not_submitted: {
    labelKey: "admin.pages.templates.notSubmitted",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  },
  unknown: {
    labelKey: "admin.pages.templates.unknown",
    className: "border-[var(--admin-border)] bg-[var(--admin-hover)] text-[var(--admin-muted)]",
  },
};

function Badge({ status }: { status: RequiredTemplate["status"] }) {
  const t = useTranslations();
  const badge = BADGE_KEYS[status];
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
    >
      {t(badge.labelKey)}
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
  const t = useTranslations();
  const tally = tallyTemplates(rows);

  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)] px-3.5 py-2.5 text-sm text-[var(--admin-muted)]">
        {reachedMeta ? (
          <>
            {t("admin.pages.templates.approvedSummary")
              .replace("{approved}", String(tally.approved))
              .replace("{total}", String(rows.length))}
            {tally.missing > 0
              ? t("admin.pages.templates.missingSummary").replace("{count}", String(tally.missing))
              : ""}
            {tally.not_submitted > 0
              ? t("admin.pages.templates.notSubmittedSummary").replace(
                  "{count}",
                  String(tally.not_submitted),
                )
              : ""}
          </>
        ) : (
          <>{t("admin.pages.templates.metaUnreachable")}</>
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
                {row.name} ·{" "}
                {row.bodyLanguage === "ar"
                  ? t("admin.pages.templates.arabicBody")
                  : t("admin.pages.templates.englishBody")}
              </p>
            </div>
            <Badge status={row.status} />
          </li>
        ))}
      </ul>

      {tally.not_submitted > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--admin-muted)]">
            {t("admin.pages.templates.textToSubmit")}
          </p>
          {TEMPLATE_PROPOSALS.map((proposal) => (
            <TemplateProposalCard key={proposal.kind} proposal={proposal} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

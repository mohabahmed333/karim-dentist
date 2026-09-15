"use client";

import { CircleCheck, Hourglass, NotebookPen } from "lucide-react";
import {
  toothName,
  toothType,
} from "@/services/patient_tooth_findings/fdi";
import type { TreatmentItem } from "@/services/patient_treatments";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { TOOTH_GLYPHS, TOOTH_SCALE } from "./toothPaths";

type Props = {
  selectedFdi: string | null;
  /** Every treatment on this patient; filtered to the selected tooth here. */
  treatments: TreatmentItem[];
  doctorNameById: Record<string, string>;
};

/** The tooth's own outline, at badge size — the same paths the chart draws. */
function ToothBadge({ fdi }: { fdi: string }) {
  const glyph = TOOTH_GLYPHS[toothType(fdi)];
  const scale = TOOTH_SCALE[toothType(fdi)];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-primary)] px-2 py-1 text-xs font-semibold text-[var(--admin-primary)]">
      <svg viewBox="-12 -18 24 36" className="h-4 w-3" aria-hidden>
        <g transform={`scale(${scale})`}>
          <path
            d={glyph.outline}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </g>
      </svg>
      {fdi}
    </span>
  );
}

/**
 * One tooth's treatments as a vertical timeline.
 *
 * Reads the same `TreatmentItem`s the rest of the chart uses, narrowed to the
 * selected tooth and ordered newest last, so the column reads downward in the
 * order the work happened.
 */
export function ToothTreatmentTimeline({
  selectedFdi,
  treatments,
  doctorNameById,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();

  if (!selectedFdi) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
        {t("admin.toothTimeline.pickTooth")}
      </div>
    );
  }

  const rows = treatments
    .filter((item) => item.toothFdi === selectedFdi)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const month = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    month: "short",
  });
  const day = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToothBadge fdi={selectedFdi} />
        <h3 className="text-lg font-semibold tracking-tight text-[var(--admin-text)]">
          {toothName(selectedFdi)}
        </h3>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--admin-border)] px-4 py-10 text-center text-sm text-[var(--admin-muted)]">
          {t("admin.toothTimeline.empty")}
        </p>
      ) : (
        <ol className="space-y-3">
          {rows.map((item, index) => {
            const done = item.status === "done";
            const at = new Date(item.createdAt);
            return (
              <li key={item.id} className="flex gap-3">
                {/* Rail: a dot per entry, joined by a line that stops at the
                    last one so the column does not trail off. */}
                <div
                  aria-hidden
                  className="relative flex w-3 shrink-0 justify-center pt-8"
                >
                  <span className="size-2.5 shrink-0 rounded-full bg-[var(--admin-muted)]" />
                  {index < rows.length - 1 ? (
                    <span className="absolute top-11 bottom-[-1.25rem] w-px bg-[var(--admin-border)]" />
                  ) : null}
                </div>

                <article className="min-w-0 flex-1 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                    <div className="shrink-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
                        {month.format(at)}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-[var(--admin-text)]">
                        {day.format(at)}
                      </p>
                    </div>

                    <Field
                      label={t("admin.toothTimeline.condition")}
                      value={item.aiInsight?.title || item.severity}
                    />
                    <Field
                      label={t("admin.toothTimeline.treatment")}
                      value={item.lastTreatment || item.cdtCode || "—"}
                    />
                    <Field
                      label={t("admin.toothTimeline.dentist")}
                      value={
                        (item.doctorId ? doctorNameById[item.doctorId] : "") ||
                        "—"
                      }
                    />

                    <span
                      className={cn(
                        "ms-auto inline-flex shrink-0 items-center gap-1.5 text-sm font-medium",
                        done ? "text-[#16A34A]" : "text-[#D97706]",
                      )}
                    >
                      {done ? (
                        <CircleCheck className="size-4" />
                      ) : (
                        <Hourglass className="size-4" />
                      )}
                      {t(
                        done
                          ? "admin.toothTimeline.done"
                          : "admin.toothTimeline.pending",
                      )}
                    </span>
                  </div>

                  {item.aiInsight?.recommendation ? (
                    <p className="mt-3 border-s-2 border-[var(--admin-primary)] ps-2 text-sm text-[var(--admin-text)]">
                      {t("admin.toothTimeline.reason")}:{" "}
                      {item.aiInsight.recommendation}
                    </p>
                  ) : null}

                  {item.aiInsight?.description ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-hover)] px-3 py-2.5 text-sm text-[var(--admin-text)]">
                      <NotebookPen className="mt-0.5 size-4 shrink-0 text-[var(--admin-muted)]" />
                      <span className="min-w-0">{item.aiInsight.description}</span>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
        {label}
      </p>
      <p className="truncate text-sm text-[var(--admin-text)]">{value}</p>
    </div>
  );
}

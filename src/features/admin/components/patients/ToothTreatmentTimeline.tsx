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
import {
  RecordTimeline,
  RecordTimelineDate,
  RecordTimelineEntry,
  RecordTimelineField,
} from "./RecordTimeline";

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
        <RecordTimeline>
          {rows.map((item, index) => {
            const done = item.status === "done";
            const at = new Date(item.createdAt);
            return (
              <RecordTimelineEntry
                key={item.id}
                connected={index < rows.length - 1}
                accent={!done}
              >
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
                  <RecordTimelineDate
                    month={month.format(at)}
                    day={day.format(at)}
                  />
                  <RecordTimelineField
                    label={t("admin.toothTimeline.condition")}
                    value={item.aiInsight?.title || item.severity}
                  />
                  <RecordTimelineField
                    label={t("admin.toothTimeline.treatment")}
                    value={item.lastTreatment || item.cdtCode || "—"}
                  />
                  <RecordTimelineField
                    label={t("admin.toothTimeline.dentist")}
                    value={
                      (item.doctorId ? doctorNameById[item.doctorId] : "") || "—"
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
              </RecordTimelineEntry>
            );
          })}
        </RecordTimeline>
      )}
    </div>
  );
}

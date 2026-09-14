"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { rootCauses, type RootCause } from "@/services/patient_notifications/rootCauses";
import type { FeatureStatus } from "./FeatureReadinessList";
import { HelpTip } from "./HelpTip";
import { useTranslations } from "@/lib/i18n";
import type { AnyMessageKey } from "@/lib/i18n";

function CauseRow({
  cause,
  open,
  onToggle,
  t,
}: {
  cause: RootCause;
  open: boolean;
  onToggle: () => void;
  t: (key: AnyMessageKey) => string;
}) {
  const blocked = cause.met === false;
  return (
    <li className="border-b border-[var(--admin-border,#e5e7eb)] last:border-b-0">
      <div className="flex items-center hover:bg-[var(--admin-canvas,#f7f7f8)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-3 pr-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
      >
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${blocked ? "bg-[#DC2626]" : "bg-[#D97706]"}`}
        />
        <span className="min-w-0 flex-1 truncate">{cause.label}</span>
        <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
          {t(blocked ? "admin.notifications.blocks" : "admin.notifications.affects").replace(
            "{count}",
            String(cause.features.length),
          )}
        </span>
        <ChevronRight
          aria-hidden
          className={`size-4 shrink-0 text-[var(--admin-muted)] transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      <span className="pr-3">
        <HelpTip text={cause.fix} />
      </span>
      </div>
      {open ? (
        <div className="space-y-1 px-3 pb-2.5 pl-[26px] text-xs leading-relaxed text-[var(--admin-muted)]">
          <p>{cause.why}</p>
          <p>
            <span className="text-[var(--admin-text,#1a1a1a)]">{t("admin.notifications.toFixLabel")}</span> {cause.fix}
          </p>
          <p>
            <span className="text-[var(--admin-text,#1a1a1a)]">{t("admin.notifications.affectsLabel")}</span> {cause.features.join(" · ")}
          </p>
        </div>
      ) : null}
    </li>
  );
}

const VISIBLE_BLOCKERS = 5;

/**
 * The few things to fix, each listed once, instead of every condition of every
 * feature. Blockers come first; things only a person can confirm are folded
 * into one row underneath so they do not crowd out what is actually broken.
 */
export function NotificationRootCauses({ features }: { features: FeatureStatus[] }) {
  const t = useTranslations();
  const causes = useMemo(() => rootCauses(features), [features]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const blockers = causes.filter((c) => c.met === false);
  // The top few carry most of the weight (they are ranked by how many features
  // they block); the rest stay one click away so Features is not pushed down.
  const visibleBlockers = showAll ? blockers : blockers.slice(0, VISIBLE_BLOCKERS);
  const hiddenCount = blockers.length - visibleBlockers.length;
  const manual = causes.filter((c) => c.met === null);
  const toggle = (key: string) => setOpenKey((current) => (current === key ? null : key));

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{t("admin.notifications.fixTheseFirst")}</h3>
        <span className="text-xs text-[var(--admin-muted)]">
          {blockers.length === 0
            ? t("admin.notifications.nothingBlocking")
            : t("admin.notifications.countToFix").replace("{count}", String(blockers.length))}
        </span>
      </div>

      {blockers.length === 0 && manual.length === 0 ? (
        <p className="rounded-lg border border-[var(--admin-border,#e5e7eb)] px-3 py-2.5 text-sm text-[var(--admin-muted)]">
          {t("admin.notifications.everythingReady")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
          {visibleBlockers.map((cause) => (
            <CauseRow key={cause.key} cause={cause} open={openKey === cause.key} onToggle={() => toggle(cause.key)} t={t} />
          ))}
          {hiddenCount > 0 || (showAll && blockers.length > VISIBLE_BLOCKERS) ? (
            <li className="border-b border-[var(--admin-border,#e5e7eb)]">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="w-full px-3 py-1.5 text-left text-xs text-[var(--admin-muted)] hover:bg-[var(--admin-canvas,#f7f7f8)] hover:text-[var(--admin-text,#1a1a1a)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              >
                {showAll
                  ? t("admin.notifications.showFewer")
                  : t("admin.notifications.showMore").replace("{count}", String(hiddenCount))}
              </button>
            </li>
          ) : null}
          {manual.length > 0 ? (
            <li>
              <button
                type="button"
                aria-expanded={manualOpen}
                onClick={() => setManualOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[var(--admin-muted)] hover:bg-[var(--admin-canvas,#f7f7f8)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              >
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-[#D97706]" />
                <span className="flex-1">
                  {t(
                    manual.length === 1
                      ? "admin.notifications.thingsToCheckOne"
                      : "admin.notifications.thingsToCheck",
                  ).replace("{count}", String(manual.length))}
                </span>
                <ChevronRight
                  aria-hidden
                  className={`size-4 shrink-0 transition-transform ${manualOpen ? "rotate-90" : ""}`}
                />
              </button>
              {manualOpen ? (
                <ul className="border-t border-[var(--admin-border,#e5e7eb)]">
                  {manual.map((cause) => (
                    <CauseRow key={cause.key} cause={cause} open={openKey === cause.key} onToggle={() => toggle(cause.key)} t={t} />
                  ))}
                </ul>
              ) : null}
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}

import type { AnyMessageKey } from "@/lib/i18n";

type TFn = (key: AnyMessageKey) => string;

/** The viewer's own local calendar date — this banner is "have you looked today", not clinic time. */
export function briefingDateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Show once per calendar day — `lastShown` is whatever was last written to localStorage. */
export function shouldShowBriefing(lastShown: string | null, now: Date): boolean {
  return lastShown !== briefingDateKey(now);
}

export function formatBriefingText(
  counts: { todayCount: number; pendingCount: number },
  t: TFn,
): string {
  const today = t("admin.chat.briefing.today").replace(
    "{count}",
    String(counts.todayCount),
  );
  const pending = t("admin.chat.briefing.pending").replace(
    "{count}",
    String(counts.pendingCount),
  );
  return `${today} · ${pending}`;
}

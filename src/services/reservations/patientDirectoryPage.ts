import {
  buildPatientHistoryStats,
  filterPatientGroups,
  type PatientGroup,
  type PatientTimelineFilter,
} from "./patientHistory";

export type PatientTableSortKey =
  | "name"
  | "phone"
  | "treatments"
  | "lastVisit"
  | "nextVisit";

function sortPatientGroups(
  groups: PatientGroup[],
  sort: PatientTableSortKey,
  dir: "asc" | "desc",
): PatientGroup[] {
  const mul = dir === "asc" ? 1 : -1;
  return [...groups].sort((a, b) => {
    const sa = buildPatientHistoryStats(a);
    const sb = buildPatientHistoryStats(b);
    let cmp = 0;
    switch (sort) {
      case "phone":
        cmp = a.phone.localeCompare(b.phone);
        break;
      case "treatments":
        cmp = sa.visitCount - sb.visitCount;
        break;
      case "lastVisit":
        cmp = (sa.lastVisit?.starts_at ?? "").localeCompare(
          sb.lastVisit?.starts_at ?? "",
        );
        break;
      case "nextVisit":
        cmp = (sa.nextVisit?.starts_at ?? "").localeCompare(
          sb.nextVisit?.starts_at ?? "",
        );
        break;
      case "name":
      default:
        cmp = a.displayName.localeCompare(b.displayName);
        break;
    }
    return cmp * mul;
  });
}

function inLastVisitRange(
  group: PatientGroup,
  from?: string | null,
  to?: string | null,
): boolean {
  if (!from || !to) return true;
  const last = buildPatientHistoryStats(group).lastVisit?.starts_at;
  if (!last) return false;
  const day = last.slice(0, 10);
  return day >= from && day <= to;
}

/** Cohort + optional last-visit date + sort + page (RSC-side; no browser filter). */
export function pagePatientGroups(
  groups: PatientGroup[],
  opts: {
    cohort: PatientTimelineFilter;
    q?: string;
    from?: string | null;
    to?: string | null;
    sort?: string;
    dir?: "asc" | "desc";
    page?: number;
    limit?: number;
  },
): { items: PatientGroup[]; total: number } {
  const cohortFiltered = filterPatientGroups(groups, opts.cohort, opts.q ?? "");
  const dated = cohortFiltered.filter((g) =>
    inLastVisitRange(g, opts.from, opts.to),
  );
  const sort = (
    ["name", "phone", "treatments", "lastVisit", "nextVisit"] as const
  ).includes(opts.sort as PatientTableSortKey)
    ? (opts.sort as PatientTableSortKey)
    : "name";
  const sorted = sortPatientGroups(
    dated,
    sort,
    opts.dir === "asc" ? "asc" : "desc",
  );
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 8));
  const start = (page - 1) * limit;
  return {
    items: sorted.slice(start, start + limit),
    total: sorted.length,
  };
}

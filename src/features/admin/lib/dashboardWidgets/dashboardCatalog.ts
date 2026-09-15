import type { AnyMessageKey } from "@/lib/i18n";

export const DASHBOARD_COL_SPANS = [3, 4, 6, 8, 9, 12] as const;
export type DashboardColSpan = (typeof DASHBOARD_COL_SPANS)[number];

export type DashboardWidgetPlacement = {
  id: string;
  colSpan: DashboardColSpan;
  /** Widgets with the same stackId render in one vertical column. */
  stackId?: string;
  /**
   * Widgets sharing a rowId stay on the same grid row.
   * Shrinking leaves gap on that row instead of pulling the next row up.
   */
  rowId?: string;
  /** Reserved grid width while resizing — legacy; stripped on write. */
  slotSpan?: DashboardColSpan;
  /** Optional fixed viewport height (px); content scrolls inside. */
  heightPx?: number;
};

export type DashboardLayout = DashboardWidgetPlacement[];

export type DashboardWidgetMeta = {
  id: string;
  labelKey: AnyMessageKey;
  defaultColSpan: DashboardColSpan;
  allowedColSpans: readonly DashboardColSpan[];
};

/** Everything a page supplies to the generic layout engine for its own widgets. */
export type DashboardCatalog = {
  ids: readonly string[];
  meta: (id: string) => DashboardWidgetMeta;
  defaultLayout: DashboardLayout;
};

export function colSpanLabelKey(colSpan: DashboardColSpan): AnyMessageKey {
  switch (colSpan) {
    case 3:
      return "admin.overview.customize.sizeQuarter";
    case 4:
      return "admin.overview.customize.sizeThird";
    case 6:
      return "admin.overview.customize.sizeHalf";
    case 8:
      return "admin.overview.customize.sizeTwoThirds";
    case 9:
      return "admin.overview.customize.sizeThreeQuarters";
    case 12:
      return "admin.overview.customize.sizeFull";
  }
}

export function colSpanClass(colSpan: DashboardColSpan): string {
  switch (colSpan) {
    case 3:
      return "col-span-12 sm:col-span-3";
    case 4:
      return "col-span-12 sm:col-span-4";
    case 6:
      return "col-span-12 sm:col-span-6";
    case 8:
      return "col-span-12 sm:col-span-8";
    case 9:
      return "col-span-12 sm:col-span-9";
    case 12:
      return "col-span-12";
  }
}

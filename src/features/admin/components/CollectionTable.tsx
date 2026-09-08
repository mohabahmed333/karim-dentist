"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownUp,
  Columns3,
  Download,
  Filter,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

export type CollectionColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | Date | null | undefined;
  searchValue?: (row: T) => string;
  hideable?: boolean;
  defaultHidden?: boolean;
};

export type CollectionBulkAction<T> = {
  id: string;
  label: string;
  onClick: (rows: T[]) => void | Promise<void>;
  tone?: "default" | "danger";
};

export type CollectionRowAction<T> = {
  id: string;
  label: string;
  icon?: "edit" | "delete";
  onClick: (row: T) => void;
  tone?: "default" | "danger";
};

/** When set, search/sort/page hit the server (nuqs); rows are already filtered. */
export type CollectionServerFiltering = {
  total: number;
  q: string;
  onQChange: (q: string) => void;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSortChange: (key: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Optional full chrome reset (q/sort/page). */
  onReset?: () => void;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type Props<T> = {
  rows: T[];
  columns: CollectionColumn<T>[];
  /** Stable id for column-visibility persistence. */
  tableId?: string;
  getRowId?: (row: T) => string;
  onRowClick?: (id: string) => void;
  selectedId?: string | null;
  emptyMessage?: string;
  className?: string;
  framed?: boolean;
  /** Hide toolbar / selection / bulk (dense embeds). */
  chrome?: boolean;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  enableSort?: boolean;
  enableSelection?: boolean;
  enableColumnManager?: boolean;
  enablePagination?: boolean;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  filterSlot?: ReactNode;
  rowActions?: CollectionRowAction<T>[];
  bulkActions?: CollectionBulkAction<T>[];
  bulkEntityLabel?: string;
  serverFiltering?: CollectionServerFiltering;
};

const PAGE_SIZE_OPTIONS = [8, 16, 32, 50];

function defaultRowId<T>(row: T): string {
  return String((row as { id: string }).id);
}

function toTime(value: string | Date | null | undefined): number | null {
  if (value == null || value === "") return null;
  const t = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(t) ? t : null;
}

function compareSort(
  a: string | number | Date | null | undefined,
  b: string | number | Date | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date || b instanceof Date) {
    return (toTime(a as Date) ?? 0) - (toTime(b as Date) ?? 0);
  }
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function loadHiddenColumns(tableId: string | undefined, columns: { key: string; defaultHidden?: boolean }[]) {
  const defaults = new Set(
    columns.filter((c) => c.defaultHidden).map((c) => c.key),
  );
  if (!tableId || typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(`admin-table-cols:${tableId}`);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return defaults;
  }
}

export function CollectionTable<T>({
  rows,
  columns,
  tableId,
  getRowId = defaultRowId,
  onRowClick,
  selectedId,
  emptyMessage,
  className,
  framed = false,
  chrome = true,
  searchPlaceholder,
  enableSearch = true,
  enableSort = true,
  enableSelection = true,
  enableColumnManager = true,
  enablePagination = true,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  defaultPageSize = 8,
  filterSlot,
  rowActions,
  bulkActions,
  bulkEntityLabel,
  serverFiltering,
}: Props<T>) {
  const t = useTranslations();
  const server = Boolean(serverFiltering);
  const [query, setQuery] = useState(serverFiltering?.q ?? "");
  const [sort, setSort] = useState<SortState>(null);
  const [pageSize, setPageSize] = useState(
    serverFiltering?.pageSize ?? defaultPageSize,
  );
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState<Set<string>>(() =>
    loadHiddenColumns(tableId, columns),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!serverFiltering) return;
    setQuery(serverFiltering.q);
  }, [serverFiltering?.q, serverFiltering]);

  useEffect(() => {
    setHidden(loadHiddenColumns(tableId, columns));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- column defs are often inline
  }, [tableId]);

  useEffect(() => {
    if (!tableId) return;
    try {
      localStorage.setItem(
        `admin-table-cols:${tableId}`,
        JSON.stringify([...hidden]),
      );
    } catch {
      /* ignore */
    }
  }, [hidden, tableId]);

  useEffect(() => {
    if (server) return;
    setPage(0);
  }, [query, pageSize, sort, rows, server]);

  useEffect(() => {
    if (!serverFiltering) return;
    const handle = window.setTimeout(() => {
      if (query === serverFiltering.q) return;
      serverFiltering.onQChange(query);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, serverFiltering]);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden.has(c.key)),
    [columns, hidden],
  );

  const filtered = useMemo(() => {
    if (server) return rows;
    let next = rows;

    if (chrome && enableSearch && query.trim()) {
      const q = query.trim().toLowerCase();
      next = next.filter((row) => {
        const parts = columns.map((col) => {
          if (col.searchValue) return col.searchValue(row);
          if (col.sortValue) {
            const v = col.sortValue(row);
            return v == null ? "" : String(v);
          }
          const direct = (row as Record<string, unknown>)[col.key];
          return direct == null ? "" : String(direct);
        });
        return parts.join(" ").toLowerCase().includes(q);
      });
    }

    if (chrome && enableSort && sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col && (col.sortValue || col.sortable !== false)) {
        const getter =
          col.sortValue ??
          ((row: T) => {
            const text = col.searchValue?.(row);
            return text ?? "";
          });
        next = [...next].sort((a, b) => {
          const cmp = compareSort(getter(a), getter(b));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }

    return next;
  }, [
    rows,
    columns,
    chrome,
    enableSearch,
    query,
    enableSort,
    sort,
    server,
  ]);

  const activePageSize = server
    ? (serverFiltering?.pageSize ?? defaultPageSize)
    : pageSize;
  const activePage = server
    ? Math.max(0, (serverFiltering?.page ?? 1) - 1)
    : page;
  const totalCount = server ? (serverFiltering?.total ?? rows.length) : filtered.length;
  const pageCount = enablePagination
    ? Math.max(1, Math.ceil(totalCount / activePageSize))
    : 1;
  const safePage = Math.min(activePage, pageCount - 1);
  const pageRows = server
    ? rows
    : enablePagination
      ? filtered.slice(safePage * activePageSize, safePage * activePageSize + activePageSize)
      : filtered;

  const pageIds = pageRows.map((r) => getRowId(r));
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected =
    pageIds.some((id) => selected.has(id)) && !allPageSelected;

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(getRowId(r))),
    [rows, selected, getRowId],
  );

  const activeSortKey = server
    ? serverFiltering?.sortKey ?? null
    : sort?.key ?? null;
  const activeSortDir = server
    ? serverFiltering?.sortDir ?? "asc"
    : sort?.dir ?? "asc";

  function toggleSort(key: string) {
    if (!enableSort) return;
    if (serverFiltering) {
      serverFiltering.onSortChange(key);
      return;
    }
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  function changePageSize(next: number) {
    if (serverFiltering) {
      serverFiltering.onPageSizeChange(next);
      return;
    }
    setPageSize(next);
  }

  function changePage(nextZeroBased: number) {
    if (serverFiltering) {
      serverFiltering.onPageChange(nextZeroBased + 1);
      return;
    }
    setPage(nextZeroBased);
  }

  function toggleHidden(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else {
        const visibleCount = columns.filter((c) => !next.has(c.key)).length;
        if (visibleCount <= 1) return prev;
        next.add(key);
      }
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAllPage(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  const showChrome = chrome;
  const showSelection = showChrome && enableSelection;
  const showRowActions = Boolean(rowActions?.length);
  const colSpan =
    visibleColumns.length +
    (showSelection ? 1 : 0) +
    (showRowActions ? 1 : 0);

  const empty =
    emptyMessage ?? t("admin.table.empty");

  return (
    <div
      className={cn(
        "relative",
        framed &&
          "overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]",
        className,
      )}
    >
      {showChrome ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
          {enableSearch ? (
            <label className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchPlaceholder ?? t("admin.table.search")
                }
                className="h-8 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] pe-3 ps-8 text-[12px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-primary)]"
              />
            </label>
          ) : (
            <div className="flex-1" />
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {enablePagination ? (
              <Select
                value={String(activePageSize)}
                onValueChange={(v) =>
                  changePageSize(Number(v ?? defaultPageSize))
                }
              >
                <SelectTrigger size="sm" className="min-w-[7.5rem]">
                  <SelectValue>
                    {t("admin.table.showRows").replace(
                      "{count}",
                      String(activePageSize),
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {pageSizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {t("admin.table.showRows").replace("{count}", String(n))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {enableColumnManager ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-2.5 text-[12px] font-medium text-[var(--admin-text)] outline-none hover:bg-[var(--admin-hover)]"
                >
                  <Columns3 className="size-3.5" />
                  {t("admin.table.manageColumns")}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t("admin.table.manageColumns")}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={!hidden.has(col.key)}
                        disabled={col.hideable === false}
                        onCheckedChange={() => toggleHidden(col.key)}
                      >
                        {col.header}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {filterSlot ? (
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="size-8 p-0"
                  aria-label={t("admin.table.filter")}
                  aria-expanded={filterOpen}
                  onClick={() => setFilterOpen((v) => !v)}
                >
                  <Filter className="size-3.5" />
                </Button>
                {filterOpen ? (
                  <div className="absolute end-0 top-[calc(100%+6px)] z-30 min-w-[16rem] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                    {filterSlot}
                  </div>
                ) : null}
              </div>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] outline-none hover:bg-[var(--admin-hover)]"
                aria-label={t("admin.table.more")}
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setQuery("");
                    if (serverFiltering) {
                      if (serverFiltering.onReset) {
                        serverFiltering.onReset();
                      } else {
                        serverFiltering.onQChange("");
                        serverFiltering.onPageChange(1);
                      }
                    } else {
                      setSort(null);
                      setPage(0);
                    }
                    setSelected(new Set());
                  }}
                >
                  {t("admin.table.resetView")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const header = visibleColumns.map((c) => c.header).join(",");
                    const body = filtered
                      .map((row) =>
                        visibleColumns
                          .map((c) => {
                            const raw =
                              c.searchValue?.(row) ?? c.sortValue?.(row) ?? "";
                            const text = String(raw ?? "").replaceAll(
                              '"',
                              '""',
                            );
                            return `"${text}"`;
                          })
                          .join(","),
                      )
                      .join("\n");
                    const blob = new Blob([`${header}\n${body}`], {
                      type: "text/csv;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${tableId ?? "table"}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="size-3.5 shrink-0" aria-hidden />
                  <span>{t("admin.table.exportCsv")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {showSelection ? (
              <TableHead className="w-10 bg-[var(--admin-hover)]/80 px-3">
                <Checkbox
                  checked={allPageSelected}
                  // base-ui: indeterminate via data attr when partial
                  data-indeterminate={somePageSelected || undefined}
                  onCheckedChange={(v) => toggleAllPage(Boolean(v))}
                  aria-label={t("admin.table.selectAll")}
                />
              </TableHead>
            ) : null}
            {visibleColumns.map((col) => {
              const sortable =
                enableSort && showChrome && col.sortable !== false;
              const active = activeSortKey === col.key;
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "bg-[var(--admin-hover)]/80 uppercase tracking-[0.04em]",
                    col.className,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1.5 text-start"
                    >
                      {col.header}
                      <ArrowDownUp
                        className={cn(
                          "size-3 opacity-40",
                          active && "opacity-100 text-[var(--admin-primary)]",
                        )}
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
            {showRowActions ? (
              <TableHead className="w-20 bg-[var(--admin-hover)]/80 text-end">
                <span className="sr-only">{t("admin.table.actions")}</span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={Math.max(colSpan, 1)}
                className="px-4 py-10 text-center text-[var(--admin-muted)]"
              >
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row) => {
              const id = getRowId(row);
              const isSelected = selected.has(id);
              return (
                <TableRow
                  key={id}
                  className={cn(onRowClick && "cursor-pointer")}
                  data-state={
                    selectedId === id || isSelected ? "selected" : undefined
                  }
                  onClick={() => onRowClick?.(id)}
                >
                  {showSelection ? (
                    <TableCell
                      className="px-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => toggleRow(id, Boolean(v))}
                        aria-label={t("admin.table.selectRow")}
                      />
                    </TableCell>
                  ) : null}
                  {visibleColumns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                  {showRowActions ? (
                    <TableCell
                      className="text-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-0.5">
                        {rowActions!.map((action) => (
                          <button
                            key={action.id}
                            type="button"
                            title={action.label}
                            aria-label={action.label}
                            onClick={() => action.onClick(row)}
                            className={cn(
                              "rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
                              action.tone === "danger" &&
                                "hover:text-red-600",
                            )}
                          >
                            {action.icon === "delete" ? (
                              <Trash2 className="size-3.5" />
                            ) : (
                              <Pencil className="size-3.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {showChrome && enablePagination && totalCount > 0 ? (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--admin-border)] px-3 py-2 text-[11px] text-[var(--admin-muted)]">
          <span>
            {t("admin.table.pageOf")
              .replace("{page}", String(safePage + 1))
              .replace("{pages}", String(pageCount))
              .replace("{total}", String(totalCount))}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safePage <= 0}
              onClick={() => changePage(Math.max(0, safePage - 1))}
            >
              {t("admin.table.prev")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={safePage >= pageCount - 1}
              onClick={() =>
                changePage(Math.min(pageCount - 1, safePage + 1))
              }
            >
              {t("admin.table.next")}
            </Button>
          </div>
        </div>
      ) : null}

      {showSelection && selectedRows.length > 0 ? (
        <div className="pointer-events-none sticky bottom-3 z-20 flex justify-center px-3 pb-1">
          <div className="pointer-events-auto flex max-w-full items-stretch overflow-hidden rounded-full bg-[#1A1A1A] text-[12px] font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
            <span className="whitespace-nowrap px-4 py-2.5">
              {t("admin.table.selected")
                .replace("{count}", String(selectedRows.length))
                .replace(
                  "{entity}",
                  bulkEntityLabel ?? t("admin.table.items"),
                )}
            </span>
            {(bulkActions ?? []).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => void action.onClick(selectedRows)}
                className={cn(
                  "whitespace-nowrap border-s border-white/15 px-4 py-2.5 transition hover:bg-white/10",
                  action.tone === "danger" && "text-red-300 hover:bg-red-500/20",
                )}
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="whitespace-nowrap border-s border-white/15 px-4 py-2.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {t("admin.table.clearSelection")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

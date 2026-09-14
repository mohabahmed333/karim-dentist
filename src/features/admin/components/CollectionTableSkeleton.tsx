import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { cn } from "@/lib/utils";

type Props = {
  /** Data column count — match the real CollectionTable's `columns` length. */
  columns?: number;
  /** Match the real table's row count for this screen (its `defaultPageSize`). */
  rows?: number;
  framed?: boolean;
  /** Match `enableSelection` (defaults to true on the real table too). */
  selectable?: boolean;
  /** Match whether `rowActions` is passed. */
  rowActions?: boolean;
  /** Match whether the real table shows its search/columns/filter toolbar. */
  toolbar?: boolean;
  /** Match whether the real table paginates (`enablePagination`, default true). */
  pagination?: boolean;
  className?: string;
};

/**
 * Mirrors CollectionTable.tsx's actual DOM — same Table/TableHeader/TableRow/
 * TableHead/TableCell primitives, same toolbar/pagination markup — so it can't
 * drift from the real table's borders, heights, or spacing. Pass the same
 * columns/rows/selectable/rowActions/toolbar/pagination a given screen's real
 * <CollectionTable> uses so the skeleton matches that screen exactly.
 */
export function CollectionTableSkeleton({
  columns = 4,
  rows = 8,
  framed = true,
  selectable = true,
  rowActions = false,
  toolbar = true,
  pagination = true,
  className,
}: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative",
        framed && "overflow-hidden rounded-xl bg-[var(--admin-panel)]",
        className,
      )}
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
          <AdminSkeleton className="h-8 min-w-[12rem] flex-1 rounded-lg" />
          <div className="flex flex-wrap items-center gap-1.5">
            <AdminSkeleton className="h-8 w-[7.5rem] rounded-lg" />
            <AdminSkeleton className="h-8 w-32 rounded-lg" />
            <AdminSkeleton className="size-8 rounded-lg" />
          </div>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {selectable ? (
              <TableHead className="w-10 bg-[var(--admin-hover)]/80 px-3">
                <AdminSkeleton className="size-4 rounded" />
              </TableHead>
            ) : null}
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="bg-[var(--admin-hover)]/80">
                <AdminSkeleton className="h-3 w-20 rounded" />
              </TableHead>
            ))}
            {rowActions ? (
              <TableHead className="w-20 bg-[var(--admin-hover)]/80" />
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {selectable ? (
                <TableCell className="px-3">
                  <AdminSkeleton className="size-4 rounded" />
                </TableCell>
              ) : null}
              {Array.from({ length: columns }).map((_, c) => (
                <TableCell key={c}>
                  <AdminSkeleton className="h-4 w-[80%] rounded" />
                </TableCell>
              ))}
              {rowActions ? (
                <TableCell className="text-end">
                  <AdminSkeleton className="ms-auto size-6 rounded-md" />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination ? (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--admin-border)] px-3 py-2">
          <AdminSkeleton className="h-3 w-32 rounded" />
          <div className="flex gap-1">
            <AdminSkeleton className="h-8 w-16 rounded-md" />
            <AdminSkeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

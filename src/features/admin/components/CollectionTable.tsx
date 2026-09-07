"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type CollectionColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T extends { id: string }> = {
  rows: T[];
  columns: CollectionColumn<T>[];
  onRowClick: (id: string) => void;
  selectedId?: string | null;
  emptyMessage?: string;
  className?: string;
  /** Outer card chrome. Off by default when parent already provides a panel. */
  framed?: boolean;
};

export function CollectionTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  selectedId,
  emptyMessage = "No items yet.",
  className,
  framed = false,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-[13px] text-[var(--admin-muted,#6b6f76)]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={cn(
        framed &&
          "overflow-hidden rounded-xl border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#fff)]",
        className,
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              data-state={selectedId === row.id ? "selected" : undefined}
              onClick={() => onRowClick(row.id)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

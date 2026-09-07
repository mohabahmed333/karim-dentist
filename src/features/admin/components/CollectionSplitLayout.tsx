import type { ReactNode } from "react";

type Props = {
  list: ReactNode;
  detail: ReactNode;
  emptyDetail?: ReactNode;
};

export function CollectionSplitLayout({ list, detail, emptyDetail }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)] lg:items-start">
      <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-panel,#fff)]">
        {list}
      </div>
      <div className="min-w-0 lg:sticky lg:top-4">
        {detail ?? (
          emptyDetail ?? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Select a row to edit, or create a new item.
            </div>
          )
        )}
      </div>
    </div>
  );
}

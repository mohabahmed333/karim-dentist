"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { AdminSearchInput } from "@/features/admin/ui";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { serviceDisplayName } from "@/features/admin/lib/serviceDisplayName";
import type { PriceableService } from "@/services/service_doctors/pricing";

type Props = {
  services: PriceableService[];
  value: string;
  onChange: (serviceId: string) => void;
  placeholder: string;
  className?: string;
};

type Option = { value: string; label: string; searchText: string };

/** A `Service` picker that filters by typing, matching against both the
 * English and Arabic title regardless of the active locale.
 *
 * The list is a portalled popover rather than an absolutely positioned child:
 * this picker is used inside the billing dialog, whose scroll container would
 * otherwise clip the list to the modal's edge. */
export function ServiceSearchSelect({
  services,
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo<Option[]>(
    () =>
      services.map((service) => {
        const label = serviceDisplayName(locale, service);
        return {
          value: service.id,
          label,
          searchText: `${service.title} ${service.title_ar ?? ""}`.toLowerCase(),
        };
      }),
    [services, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.searchText.includes(q));
  }, [options, query]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger
        aria-controls={listId}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-border)]",
          selectedLabel ? "text-[var(--admin-text)]" : "text-[var(--admin-muted)]",
          className,
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-[var(--admin-muted)]" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          className="isolate z-(--z-popover)"
        >
          <Popover.Popup
            // The search box, not the popup itself — typing is the point.
            initialFocus={inputRef}
            className="flex max-h-(--available-height) w-(--anchor-width) min-w-56 flex-col overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] outline-none"
          >
            <div className="p-2">
              <AdminSearchInput
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filtered[0]) {
                    e.preventDefault();
                    pick(filtered[0].value);
                  }
                }}
                placeholder={t("admin.filters.searchServices")}
                aria-label={t("admin.filters.searchServices")}
              />
            </div>
            <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-center text-xs text-[var(--admin-muted)]">
                  {t("admin.filters.noMatches")}
                </li>
              ) : (
                filtered.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => pick(option.value)}
                      className={cn(
                        "flex w-full px-3 py-2 text-start text-sm hover:bg-[var(--admin-hover)]",
                        option.value === value && "bg-[var(--admin-hover)] font-medium",
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
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
 * English and Arabic title regardless of the active locale. */
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
  const rootRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-border)]",
          selectedLabel ? "text-[var(--admin-text)]" : "text-[var(--admin-muted)]",
        )}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-[var(--admin-muted)]" />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="p-2">
            <AdminSearchInput
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setOpen(false);
                  setQuery("");
                }
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
        </div>
      ) : null}
    </div>
  );
}

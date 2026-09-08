"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Search } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Service } from "@/services/services/types";
import {
  GENERAL_CONSULTATION_LABEL_EN,
  serviceDisplayName,
} from "@/features/admin/lib/serviceDisplayName";

export const SERVICE_PICKER_CONSULT_VALUE = "consultation";

type Props = {
  services: Service[];
  value: string;
  disabled?: boolean;
  id?: string;
  onChange: (serviceValue: string) => void;
  className?: string;
};

type Option = {
  value: string;
  label: string;
  searchText: string;
  group?: string;
};

export function ServicePicker({
  services,
  value,
  disabled,
  id,
  onChange,
  className,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteServices, setRemoteServices] = useState<Service[] | null>(null);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setRemoteServices(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/services?q=${encodeURIComponent(q)}&limit=60`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((payload: { items?: Service[] }) => {
          setRemoteServices(Array.isArray(payload.items) ? payload.items : []);
        })
        .catch(() => undefined);
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const catalog = remoteServices ?? services;

  const options = useMemo<Option[]>(() => {
    const consult = t("admin.chat.generalConsultation");
    const ourLabel = t("admin.pages.services.ourServices");
    const laserLabel = t("admin.pages.services.laser");
    const rows: Option[] = [
      {
        value: SERVICE_PICKER_CONSULT_VALUE,
        label: consult,
        searchText: `${consult} ${GENERAL_CONSULTATION_LABEL_EN}`.toLowerCase(),
      },
    ];
    for (const service of catalog) {
      if (service.kind === "laser") continue;
      const label = serviceDisplayName(locale, service);
      rows.push({
        value: service.id,
        label,
        searchText: `${service.title} ${service.title_ar ?? ""} ${label}`.toLowerCase(),
        group: ourLabel,
      });
    }
    for (const service of catalog) {
      if (service.kind !== "laser") continue;
      const label = serviceDisplayName(locale, service);
      rows.push({
        value: service.id,
        label,
        searchText: `${service.title} ${service.title_ar ?? ""} ${label}`.toLowerCase(),
        group: laserLabel,
      });
    }
    return rows;
  }, [catalog, locale, t]);

  // Server already filtered when remoteServices is set; keep consult match client-side.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || remoteServices) {
      if (!q) return options;
      return options.filter(
        (o) =>
          o.value === SERVICE_PICKER_CONSULT_VALUE
            ? o.searchText.includes(q)
            : true,
      );
    }
    return options.filter((o) => o.searchText.includes(q));
  }, [options, query, remoteServices]);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    services
      .map((s) => ({
        value: s.id,
        label: serviceDisplayName(locale, s),
      }))
      .find((o) => o.value === value)?.label ??
    t("admin.reservations.service");

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

  let lastGroup: string | undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] px-3 text-start text-sm text-[var(--admin-text,#1a1a1a)] shadow-none outline-none focus-visible:border-[var(--admin-border,#d1d5db)] focus-visible:ring-2 focus-visible:ring-[var(--admin-border,#e5e7eb)] disabled:opacity-50",
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronsUpDown className="size-4 shrink-0 text-[var(--admin-muted,#6b7280)]" />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-2 border-b border-[var(--admin-border,#e5e7eb)] px-3 py-2">
            <Search className="size-4 shrink-0 text-[var(--admin-muted,#9ca3af)]" />
            <input
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
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--admin-muted,#9ca3af)]"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-center text-xs text-[var(--admin-muted,#9ca3af)]">
                {t("admin.filters.noMatches")}
              </li>
            ) : (
              filtered.map((option) => {
                const showGroup =
                  option.group && option.group !== lastGroup;
                if (option.group) lastGroup = option.group;
                return (
                  <li key={option.value}>
                    {showGroup ? (
                      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-muted,#6b7280)]">
                        {option.group}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => pick(option.value)}
                      className={cn(
                        "flex w-full px-3 py-2 text-start text-sm hover:bg-[var(--admin-hover,#f3f4f6)]",
                        option.value === value &&
                          "bg-[var(--admin-hover,#f3f4f6)] font-medium",
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

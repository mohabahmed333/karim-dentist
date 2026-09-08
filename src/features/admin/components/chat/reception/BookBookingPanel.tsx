"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { serviceDisplayName } from "@/features/admin/lib/serviceDisplayName";
import type { Service } from "@/services/services/types";

export type BookPollOption = {
  id: string;
  label: string;
  serviceId: string;
  serviceLabel: string;
  /** Extra EN/AR text for search (optional). */
  searchText?: string;
};

type Props = {
  name: string;
  phone: string;
  options: BookPollOption[];
  selectedId: string | null;
  pending?: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSelectService: (option: BookPollOption) => void;
  onContinue: () => void;
  onCancel: () => void;
};

function toPollOptions(
  services: Service[],
  locale: "en" | "ar",
): BookPollOption[] {
  return services.map((service) => {
    const label = serviceDisplayName(locale, service);
    return {
      id: service.id,
      label,
      serviceId: service.id,
      serviceLabel: label,
      searchText: `${service.title} ${service.title_ar ?? ""}`,
    };
  });
}

export function BookBookingPanel({
  name,
  phone,
  options,
  selectedId,
  pending,
  onNameChange,
  onPhoneChange,
  onSelectService,
  onContinue,
  onCancel,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [serviceQuery, setServiceQuery] = useState("");
  const [remoteOptions, setRemoteOptions] = useState<BookPollOption[] | null>(
    null,
  );

  useEffect(() => {
    const q = serviceQuery.trim();
    if (!q) {
      setRemoteOptions(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/admin/services?q=${encodeURIComponent(q)}&limit=60`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((payload: { items?: Service[] }) => {
          const items = Array.isArray(payload.items) ? payload.items : [];
          setRemoteOptions(toPollOptions(items, locale));
        })
        .catch(() => undefined);
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [locale, serviceQuery]);

  const filteredOptions = useMemo(() => {
    if (remoteOptions) return remoteOptions;
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack =
        `${option.label} ${option.serviceLabel} ${option.searchText ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, remoteOptions, serviceQuery]);

  const canContinue =
    name.trim().length > 0 && phone.trim().length > 0 && Boolean(selectedId);

  return (
    <div className="mt-2.5 space-y-3 rounded-2xl border border-[#E8EAED] bg-[#F8F9FB] p-3">
      <div>
        <p className="text-[13px] font-semibold text-[#111111]">
          {t("admin.poll.patientDetails")}
        </p>
        <p className="mt-0.5 text-[11px] text-[#70758A]">
          {t("admin.poll.editThenService")}
        </p>
        <div className="mt-2 space-y-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-[#70758A]">
              {t("admin.poll.name")}
            </span>
            <input
              value={name}
              disabled={pending}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t("admin.poll.namePlaceholder")}
              className="h-9 w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-[13px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[var(--admin-primary)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-[#70758A]">
              {t("admin.poll.phone")}
            </span>
            <input
              value={phone}
              disabled={pending}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+20 …"
              inputMode="tel"
              className="h-9 w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-[13px] text-[#111111] outline-none placeholder:text-[#9CA3AF] focus:border-[var(--admin-primary)]"
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[#111111]">
          {t("admin.poll.chooseService")}
        </p>
        <p className="mt-0.5 text-[11px] text-[#70758A]">
          {t("admin.poll.servicesCount").replace(
            "{count}",
            String(
              serviceQuery.trim() ? filteredOptions.length : options.length,
            ),
          )}
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#E8EAED] bg-white px-3 py-2">
          <Search className="size-4 shrink-0 text-[#9CA3AF]" aria-hidden />
          <input
            value={serviceQuery}
            disabled={pending}
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder={t("admin.filters.searchServices")}
            aria-label={t("admin.filters.searchServices")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111111] outline-none placeholder:text-[#9CA3AF] disabled:opacity-50"
          />
        </div>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pe-0.5">
          {filteredOptions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8EAED] bg-white px-3 py-4 text-center text-[12px] text-[#70758A]">
              {t("admin.filters.noMatches")}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const selected = selectedId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={pending}
                  onClick={() => onSelectService(option)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start text-[13px] font-medium text-[#111111] transition-colors ${
                    selected
                      ? "border-[#111111] bg-[#F1F3F5]"
                      : "border-[#E8EAED] bg-white hover:border-[#C5C9D2]"
                  } disabled:opacity-50`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      selected
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-[#C5C9D2] bg-white"
                    }`}
                    aria-hidden
                  >
                    {selected ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">{option.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || !canContinue}
          onClick={onContinue}
          className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
        >
          {t("admin.poll.continueDate")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="rounded-lg border border-[#E8EAED] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111111]"
        >
          {t("admin.poll.cancel")}
        </button>
      </div>
    </div>
  );
}

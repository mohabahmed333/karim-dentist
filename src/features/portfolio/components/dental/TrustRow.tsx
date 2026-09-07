"use client";

import { localizedCms, useLocale, useTranslations } from "@/lib/i18n";
import type { TrustItem } from "@/services/dental/types";
import { ScrollReveal } from "./ScrollReveal";

type TrustRowProps = {
  items: TrustItem[];
};

export function TrustRow({ items }: TrustRowProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const fallback: TrustItem[] = [
    {
      id: "0",
      value: t("trustOneValue"),
      label: t("trustOneLabel"),
      sort_order: 0,
    },
    {
      id: "1",
      value: t("trustTwoValue"),
      label: t("trustTwoLabel"),
      sort_order: 1,
    },
    {
      id: "2",
      value: t("trustThreeValue"),
      label: t("trustThreeLabel"),
      sort_order: 2,
    },
  ];

  const display = items.length ? items : fallback;

  return (
    <ScrollReveal>
      <div className="grid gap-4 border-t border-[#e6e8ec] pt-8 sm:grid-cols-3">
        {display.map((item, index) => {
          const defaults = fallback[index];
          const value = localizedCms(
            locale,
            item.value,
            item.value_ar,
            defaults?.value ?? item.value,
          );
          const label = localizedCms(
            locale,
            item.label,
            item.label_ar,
            defaults?.label ?? item.label,
          );
          return (
            <div
              key={item.id ?? item.value}
              className="rounded-[22px] bg-white px-5 py-4"
              data-customize-item={item.id}
            >
              <strong
                className="block text-lg text-[#0f2744]"
                data-customize-field="value"
              >
                {value}
              </strong>
              <span
                className="text-sm text-[#6b7280]"
                data-customize-field="label"
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollReveal>
  );
}

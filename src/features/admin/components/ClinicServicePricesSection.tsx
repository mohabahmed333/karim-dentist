"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { AdminSkeleton } from "./AdminSkeleton";
import {
  listServicesForPricing,
  updateServicePriceRange,
  type ServicePriceRow,
} from "@/services/services";

/**
 * The services catalog's own price range, editable right next to the CDT
 * procedure fee list — same on-blur-save interaction ClinicMenuList already
 * uses for CDT fees. Price-only: titles, images, and everything else about
 * a service still live on the Services page.
 */
export function ClinicServicePricesSection() {
  const t = useTranslations();
  const [rows, setRows] = useState<ServicePriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listServicesForPricing()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : t("admin.pages.clinicPrices.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  function patch(id: string, partial: Partial<ServicePriceRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...partial } : row)));
  }

  async function save(row: ServicePriceRow) {
    setSavingId(row.id);
    try {
      await updateServicePriceRange(row.id, row.price_min_egp, row.price_max_egp);
      toast.success(t("admin.pages.clinicPrices.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div aria-busy="true" className="space-y-2">
        <span className="sr-only">{t("admin.pages.clinicPrices.loadingSr")}</span>
        {[0, 1, 2].map((i) => (
          <AdminSkeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-[#64748B]">{t("admin.pages.clinicPrices.empty")}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2"
          // Save once focus actually leaves the row, not on every hop between
          // its own Min/Max fields — tabbing from Min to Max would otherwise
          // save Min with Max still blank, since blur fires field-by-field.
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              void save(row);
            }
          }}
        >
          <span className="min-w-0 flex-1 truncate text-sm text-[#1E293B]">{row.title}</span>
          <Input
            type="number"
            min={0}
            step={1}
            placeholder={t("admin.pages.clinicPrices.min")}
            aria-label={t("admin.pages.clinicPrices.minAriaLabel").replace("{title}", row.title)}
            className="h-8 w-20"
            value={row.price_min_egp ?? ""}
            disabled={savingId === row.id}
            onChange={(e) =>
              patch(row.id, {
                price_min_egp: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          <span className="text-xs text-[#94A3B8]">{t("admin.pages.clinicPrices.to")}</span>
          <Input
            type="number"
            min={0}
            step={1}
            placeholder={t("admin.pages.clinicPrices.max")}
            aria-label={t("admin.pages.clinicPrices.maxAriaLabel").replace("{title}", row.title)}
            className="h-8 w-20"
            value={row.price_max_egp ?? ""}
            disabled={savingId === row.id}
            onChange={(e) =>
              patch(row.id, {
                price_max_egp: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </li>
      ))}
    </ul>
  );
}

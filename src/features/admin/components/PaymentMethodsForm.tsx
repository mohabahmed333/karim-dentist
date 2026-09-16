"use client";

import { useState, useTransition } from "react";
import { Star, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/features/admin/ui";
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui/AdminSelect";
import {
  deletePaymentMethod,
  savePaymentMethod,
  setPrimaryPaymentMethod,
  type PaymentMethod,
  type PaymentMethodKind,
} from "@/services/payment_methods";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  initialMethods: PaymentMethod[];
  canEdit: boolean;
};

const KINDS: PaymentMethodKind[] = ["instapay", "wallet"];

/**
 * Where patients send money, as a list the clinic maintains itself.
 *
 * One method per kind is marked primary, and the primaries are what a patient
 * is told to pay — the rest stay valid when a receipt is checked, so an older
 * number that someone saved still verifies instead of landing in review.
 */
export function PaymentMethodsForm({ initialMethods, canEdit }: Props) {
  const t = useTranslations();
  const [methods, setMethods] = useState(initialMethods);
  const [draftKind, setDraftKind] = useState<PaymentMethodKind>("instapay");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [pending, startTransition] = useTransition();

  function refresh(next: PaymentMethod[]) {
    setMethods(
      [...next].sort(
        (a, b) =>
          a.kind.localeCompare(b.kind) ||
          Number(b.is_primary) - Number(a.is_primary) ||
          a.sort_order - b.sort_order,
      ),
    );
  }

  function add() {
    if (!draftValue.trim()) {
      toast.error(t("admin.paymentMethods.valueRequired"));
      return;
    }
    startTransition(async () => {
      try {
        const created = await savePaymentMethod(null, {
          kind: draftKind,
          label: draftLabel,
          value: draftValue,
          // The first of a kind becomes primary on its own: a lone method
          // nobody marked would otherwise never be sent to a patient.
          is_primary: !methods.some((m) => m.kind === draftKind),
        });
        refresh([...methods, created]);
        setDraftLabel("");
        setDraftValue("");
        toast.success(t("admin.paymentMethods.added"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function makePrimary(id: string) {
    startTransition(async () => {
      try {
        await setPrimaryPaymentMethod(id);
        const target = methods.find((m) => m.id === id);
        refresh(
          methods.map((m) =>
            m.kind === target?.kind ? { ...m, is_primary: m.id === id } : m,
          ),
        );
        toast.success(t("admin.paymentMethods.primarySet"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      try {
        await deletePaymentMethod(id);
        refresh(methods.filter((m) => m.id !== id));
        toast.success(t("admin.paymentMethods.removed"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-lg font-semibold text-[var(--admin-text)]">
          {t("admin.paymentMethods.title")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--admin-muted)]">
          {t("admin.paymentMethods.description")}
        </p>
      </header>

      {KINDS.map((kind) => {
        const ofKind = methods.filter((m) => m.kind === kind);
        return (
          <div
            key={kind}
            className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4"
          >
            <h2 className="text-sm font-medium text-[var(--admin-text)]">
              {t(
                kind === "instapay"
                  ? "admin.paymentMethods.instapay"
                  : "admin.paymentMethods.wallet",
              )}
            </h2>

            {ofKind.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--admin-muted)]">
                {t("admin.paymentMethods.none")}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ofKind.map((method) => (
                  <li
                    key={method.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[var(--admin-text)]">
                        {method.value}
                      </span>
                      {method.label ? (
                        <span className="block truncate text-xs text-[var(--admin-muted)]">
                          {method.label}
                        </span>
                      ) : null}
                    </span>

                    {method.is_primary ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--admin-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">
                        <Star className="size-3" aria-hidden />
                        {t("admin.paymentMethods.primary")}
                      </span>
                    ) : canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => makePrimary(method.id)}
                      >
                        {t("admin.paymentMethods.makePrimary")}
                      </Button>
                    ) : null}

                    {canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        aria-label={t("admin.paymentMethods.remove")}
                        onClick={() => remove(method.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      {canEdit ? (
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <h2 className="text-sm font-medium text-[var(--admin-text)]">
            {t("admin.paymentMethods.addTitle")}
          </h2>
          <div className={cn("mt-3 grid gap-2 sm:grid-cols-[10rem_1fr_1fr_auto]")}>
            <AdminSelect
              value={draftKind}
              onValueChange={(value) => setDraftKind(value as PaymentMethodKind)}
            >
              <AdminSelectTrigger aria-label={t("admin.paymentMethods.kind")}>
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent alignItemWithTrigger={false} align="start">
                <AdminSelectItem value="instapay">
                  {t("admin.paymentMethods.instapay")}
                </AdminSelectItem>
                <AdminSelectItem value="wallet">
                  {t("admin.paymentMethods.wallet")}
                </AdminSelectItem>
              </AdminSelectContent>
            </AdminSelect>
            <AdminInput
              value={draftValue}
              placeholder={t("admin.paymentMethods.valuePlaceholder")}
              onChange={(e) => setDraftValue(e.target.value)}
            />
            <AdminInput
              value={draftLabel}
              placeholder={t("admin.paymentMethods.labelPlaceholder")}
              onChange={(e) => setDraftLabel(e.target.value)}
            />
            <Button type="button" disabled={pending} onClick={add}>
              <Plus className="size-3.5" />
              {t("admin.paymentMethods.add")}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

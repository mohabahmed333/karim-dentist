"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { proposalForKind } from "@/services/patient_notifications/templateProposals";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  /** The outbox kind whose template is missing, e.g. billing_payment_request. */
  kind: string;
};

/**
 * Why the WhatsApp action is off, and the exact text to submit to Meta.
 *
 * The draft already existed in templateProposals.ts — written precisely so the
 * answer to "what do I write?" sits beside the thing it unblocks — but nothing
 * showed it. Being told an action is disabled without being told what to do
 * about it is what leaves it disabled for months.
 */
export function WhatsappTemplateDialog({ kind }: Props) {
  const t = useTranslations();
  const [copied, setCopied] = useState<string | null>(null);
  const proposal = proposalForKind(kind);
  if (!proposal) return null;

  async function copy(field: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard is blocked outside a secure context; the text is on screen
      // and selectable either way, so this is not worth an error dialog.
      toast.error(t("admin.billing.templateCopyFailed"));
    }
  }

  const rows: { id: string; label: string; value: string; mono?: boolean }[] = [
    {
      id: "name-en",
      label: t("admin.billing.templateNameEn"),
      value: proposal.names.en,
      mono: true,
    },
    {
      id: "body-en",
      label: t("admin.billing.templateBodyEn"),
      value: proposal.bodyEn,
    },
    {
      id: "name-ar",
      label: t("admin.billing.templateNameAr"),
      value: proposal.names.ar,
      mono: true,
    },
    {
      id: "body-ar",
      label: t("admin.billing.templateBodyAr"),
      value: proposal.bodyAr,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger
        type="button"
        aria-label={t("admin.billing.whatsappDisabledTitle")}
        title={t("admin.billing.whatsappDisabledTitle")}
        className="inline-flex size-5 shrink-0 cursor-help items-center justify-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel)] text-[11px] font-semibold leading-none text-[var(--admin-muted)] transition-colors hover:border-[var(--admin-text)] hover:text-[var(--admin-text)]"
      >
        ?
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--admin-text)]">
            {t("admin.billing.whatsappDisabledTitle")}
          </DialogTitle>
          <DialogDescription className="text-[var(--admin-muted)]">
            {t("admin.billing.whatsappDisabledWhy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--admin-text)]">
              {t("admin.billing.templateSubmitTitle")}
            </p>
            <p className="mt-1 text-xs text-[var(--admin-muted)]">
              {t("admin.billing.templateSubmitHint")}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--admin-border)] p-3 text-xs">
            <div>
              <dt className="text-[var(--admin-muted)]">
                {t("admin.billing.templateCategory")}
              </dt>
              <dd className="mt-0.5 font-medium text-[var(--admin-text)]">
                {proposal.category}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-muted)]">
                {t("admin.billing.templateLanguage")}
              </dt>
              <dd className="mt-0.5 font-medium text-[var(--admin-text)]">
                en_US
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-[var(--admin-muted)]">
                {t("admin.billing.templateParams")}
              </dt>
              <dd className="mt-0.5 font-medium text-[var(--admin-text)]">
                {proposal.params
                  .map((p, i) => `{{${i + 1}}} ${p}`)
                  .join(" · ")}
              </dd>
            </div>
          </dl>

          <ul className="space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-[var(--admin-border)] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
                    {row.label}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copy(row.id, row.value)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                  >
                    {copied === row.id ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    {t(
                      copied === row.id
                        ? "admin.billing.templateCopied"
                        : "admin.billing.templateCopy",
                    )}
                  </button>
                </div>
                <p
                  dir="auto"
                  className={cn(
                    "mt-1 select-all text-sm text-[var(--admin-text)]",
                    row.mono && "font-mono text-xs",
                  )}
                >
                  {row.value}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

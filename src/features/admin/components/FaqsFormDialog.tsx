"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import type { Faq } from "@/services/faqs";
import { FaqsForm } from "./FaqsForm";

type Props = {
  open: boolean;
  item: Faq | null;
  pending: boolean;
  message: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function FaqsFormDialog({
  open,
  item,
  pending,
  message,
  onOpenChange,
  onSubmit,
  onDeleteClick,
}: Props) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle>{t("admin.edit")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {item ? (
            <FaqsForm
              key={item.id}
              item={item}
              onSubmit={onSubmit}
              pending={pending}
              message={message}
            />
          ) : null}
        </div>

        <DialogFooter className="m-0 shrink-0 flex-row justify-between rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
          <Button variant="destructive" size="sm" onClick={onDeleteClick}>
            {t("admin.delete")}
          </Button>
          <Button type="submit" form="faqs-form" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import type { FooterLink } from "@/services/footer_links";
import { FooterLinkForm } from "./FooterLinkForm";

type Props = {
  open: boolean;
  item: FooterLink | null;
  pending: boolean;
  message: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function FooterLinkFormDialog({
  open,
  item,
  pending,
  message,
  onOpenChange,
  onSubmit,
  onDeleteClick,
}: Props) {
  const reserved = item ? isReservedFooterLink(item) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 space-y-1 px-4 pt-4 pe-12">
          <DialogTitle>{reserved ? "Contact" : "Edit link"}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {item && reserved ? (
            <p className="text-sm text-muted-foreground">
              This footer link is fixed on the site and opens the contact form.
              Edit contact details under Settings → Contact.
            </p>
          ) : item ? (
            <FooterLinkForm
              key={item.id}
              item={item}
              onSubmit={onSubmit}
              pending={pending}
              message={message}
            />
          ) : null}
        </div>

        {!reserved ? (
          <DialogFooter className="m-0 shrink-0 flex-row justify-between rounded-none border-[var(--admin-border)] bg-[var(--admin-hover)]/40 px-4 py-3">
            <Button variant="destructive" size="sm" onClick={onDeleteClick}>
              Delete
            </Button>
            <Button type="submit" form="footer-link-form" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

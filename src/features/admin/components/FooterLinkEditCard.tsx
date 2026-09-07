"use client";

import type { FooterLink } from "@/services/footer_links";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { FooterLinkForm } from "./FooterLinkForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  item: FooterLink;
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function FooterLinkEditCard({
  item,
  pending,
  message,
  onSubmit,
  onDeleteClick,
}: Props) {
  if (isReservedFooterLink(item)) {
    return (
      <Card className="gap-0 p-5">
        <h2 className="text-lg font-medium">Contact</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          This footer link is fixed on the site and opens the contact form.
          Edit contact details under Settings → Contact.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Edit link</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          Delete
        </Button>
      </div>
      <FooterLinkForm
        key={item.id}
        item={item}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button
        className="mt-4 w-full"
        type="submit"
        form="footer-link-form"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}

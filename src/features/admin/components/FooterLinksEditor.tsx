"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createFooterLink,
  softDeleteFooterLink,
  updateFooterLink,
  type FooterLink,
} from "@/services/footer_links";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { FooterLinkEditCard } from "./FooterLinkEditCard";
import { Button } from "@/components/ui/button";

type Props = { items: FooterLink[] };

const columnLabel: Record<string, string> = {
  portfolio: "Portfolio",
  resources: "Resources",
  follow: "Follow",
};

export function FooterLinksEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<FooterLink>({
    initial,
    create: (sort_order) =>
      createFooterLink({
        label: t("admin.untitled"),
        href: "#",
        column_key: "portfolio",
        sort_order,
      }),
    update: async (id, payload) => {
      const row = await updateFooterLink(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteFooterLink,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.footer.title"
        descriptionKey="admin.pages.footer.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.footer.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.footer.empty")}
              onRowClick={(id) => {
                const row = board.items.find((item) => item.id === id);
                if (!row || isReservedFooterLink(row)) return;
                board.openItem(id);
              }}
              columns={[
                { key: "label", header: "Label", cell: (r) => r.label },
                {
                  key: "column",
                  header: "Column",
                  cell: (r) => columnLabel[r.column_key] ?? r.column_key,
                },
                { key: "href", header: "Href", cell: (r) => r.href },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <FooterLinkEditCard
              item={board.selected}
              pending={board.pending}
              message={board.message}
              onSubmit={board.onSave}
              onDeleteClick={() => setDeleteOpen(true)}
            />
          ) : null
        }
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        pending={board.pending}
        onConfirm={() => {
          void board.onDelete();
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

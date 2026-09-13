"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createClientRow,
  softDeleteClient,
  updateClient,
  type Client,
} from "@/services/clients";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { ClientFormDialog } from "./ClientFormDialog";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";

type Props = { items: Client[] };

export function ClientsEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<Client>({
    initial,
    create: (sort_order) => createClientRow({ name: t("admin.untitled"), sort_order }),
    update: async (id, payload) => {
      const row = await updateClient(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteClient,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.clients.title"
        descriptionKey="admin.pages.clients.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.clients.add")}
          </Button>
        }
      />
      <CollectionTable
        framed
        tableId="clients"
        rows={board.items}
        selectedId={board.selected?.id}
        emptyMessage={t("admin.pages.clients.empty")}
        onRowClick={board.openItem}
        rowActions={[
          { id: "edit", label: t("admin.edit"), icon: "edit", onClick: (r) => board.openItem(r.id) },
          {
            id: "delete",
            label: t("admin.delete"),
            icon: "delete",
            tone: "danger",
            onClick: (r) => {
              board.openItem(r.id);
              setDeleteOpen(true);
            },
          },
        ]}
        columns={[
          { key: "name", header: t("admin.name"), cell: (r) => r.name },
          {
            key: "logo",
            header: t("admin.pages.clients.logo"),
            cell: (r) => (r.logo_url ? t("admin.yes") : "—"),
          },
        ]}
      />
      <ClientFormDialog
        open={Boolean(board.selected)}
        item={board.selected}
        pending={board.pending}
        message={board.message}
        onOpenChange={(open) => {
          if (!open) board.close();
        }}
        onSubmit={board.onSave}
        onDeleteClick={() => setDeleteOpen(true)}
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

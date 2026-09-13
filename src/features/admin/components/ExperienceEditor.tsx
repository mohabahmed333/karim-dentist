"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createExperience,
  softDeleteExperience,
  updateExperience,
  type ExperienceEntry,
} from "@/services/experience_entries";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ExperienceFormDialog } from "./ExperienceFormDialog";
import { Button } from "@/components/ui/button";

type Props = { items: ExperienceEntry[] };

export function ExperienceEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<ExperienceEntry>({
    initial,
    create: (sort_order) => createExperience({ title: t("admin.untitled"), sort_order }),
    update: async (id, payload) => {
      const row = await updateExperience(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteExperience,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.experience.title"
        descriptionKey="admin.pages.experience.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.experience.add")}
          </Button>
        }
      />
      <CollectionTable
        framed
        tableId="experience"
        rows={board.items}
        selectedId={board.selected?.id}
        emptyMessage={t("admin.pages.experience.empty")}
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
          { key: "title", header: t("admin.cms.title"), cell: (r) => r.title },
          { key: "org", header: t("admin.pages.experience.org"), cell: (r) => r.org ?? "—" },
          {
            key: "date",
            header: t("admin.reservations.date"),
            cell: (r) => r.date_label ?? "—",
          },
        ]}
      />
      <ExperienceFormDialog
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

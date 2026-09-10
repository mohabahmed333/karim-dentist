"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import {
  createClinicKnowledge,
  softDeleteClinicKnowledge,
  updateClinicKnowledge,
  type ClinicKnowledge,
} from "@/services/clinic_knowledge";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { KnowledgeEditCard } from "./KnowledgeEditCard";
import { Button } from "@/components/ui/button";

type Props = { items: ClinicKnowledge[] };

export function KnowledgeEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<ClinicKnowledge>({
    initial,
    create: (sort_order) =>
      createClinicKnowledge({
        title: t("admin.untitled"),
        title_ar: "",
        body: "",
        body_ar: "",
        tags: [],
        sort_order,
        // New entries start unpublished: an empty answer must never be
        // something the assistant can quote to a patient.
        is_published: false,
      }),
    update: async (id, payload) => {
      const row = await updateClinicKnowledge(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteClinicKnowledge,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.knowledge.title"
        descriptionKey="admin.pages.knowledge.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.knowledge.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="clinic_knowledge"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.knowledge.empty")}
              onRowClick={board.openItem}
              bulkEntityLabel={t("admin.pages.knowledge.title").toLowerCase()}
              rowActions={[
                {
                  id: "edit",
                  label: t("admin.edit"),
                  icon: "edit",
                  onClick: (r) => board.openItem(r.id),
                },
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
              bulkActions={[
                {
                  id: "delete",
                  label: t("admin.table.bulkDelete"),
                  tone: "danger",
                  onClick: async (selected) => {
                    for (const row of selected) {
                      await softDeleteClinicKnowledge(row.id);
                    }
                    toast.success(t("admin.delete"));
                    window.location.reload();
                  },
                },
              ]}
              columns={[
                {
                  key: "title",
                  header: t("admin.pages.knowledge.entry"),
                  sortValue: (r) => r.title,
                  searchValue: (r) =>
                    `${r.title} ${r.title_ar ?? ""} ${r.body} ${r.body_ar ?? ""}`,
                  cell: (r) => r.title,
                },
                {
                  key: "tags",
                  header: t("admin.pages.knowledge.tags"),
                  sortValue: (r) => (r.tags ?? []).join(","),
                  cell: (r) => (r.tags ?? []).join(", "),
                },
                {
                  key: "published",
                  header: t("admin.cms.published"),
                  sortValue: (r) => (r.is_published ? 1 : 0),
                  cell: (r) => (r.is_published ? t("admin.yes") : t("admin.no")),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <KnowledgeEditCard
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

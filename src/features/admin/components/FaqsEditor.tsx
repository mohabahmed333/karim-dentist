"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createFaq,
  softDeleteFaq,
  updateFaq,
  type Faq,
} from "@/services/faqs";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { FaqsEditCard } from "./FaqsEditCard";
import { Button } from "@/components/ui/button";

type Props = { items: Faq[] };

export function FaqsEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<Faq>({
    initial,
    create: (sort_order) =>
      createFaq({
        question: t("admin.untitled"),
        question_ar: "",
        answer: "",
        answer_ar: "",
        sort_order,
        is_published: true,
      }),
    update: async (id, payload) => {
      const row = await updateFaq(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteFaq,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.faq.title"
        descriptionKey="admin.pages.faq.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.faq.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="faqs"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.faq.empty")}
              onRowClick={board.openItem}
              bulkEntityLabel={t("admin.pages.faq.title").toLowerCase()}
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
                      await softDeleteFaq(row.id);
                    }
                    toast.success(t("admin.delete"));
                    window.location.reload();
                  },
                },
              ]}
              columns={[
                {
                  key: "question",
                  header: t("admin.pages.faq.question"),
                  sortValue: (r) => r.question,
                  searchValue: (r) => `${r.question} ${r.question_ar ?? ""}`,
                  cell: (r) => r.question,
                },
                {
                  key: "published",
                  header: t("admin.cms.published"),
                  sortValue: (r) => (r.is_published ? 1 : 0),
                  cell: (r) =>
                    r.is_published ? t("admin.yes") : t("admin.no"),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <FaqsEditCard
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

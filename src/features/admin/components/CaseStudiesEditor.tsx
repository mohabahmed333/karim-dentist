"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createCaseStudy,
  softDeleteCaseStudy,
  updateCaseStudy,
  type CaseStudy,
} from "@/services/case_studies";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CaseStudyEditCard } from "./CaseStudyEditCard";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = { items: CaseStudy[] };

export function CaseStudiesEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<CaseStudy>({
    initial,
    create: (sort_order, isPublished = true) =>
      createCaseStudy({
        title: t("admin.untitled"),
        description: "",
        sort_order,
        is_published: Boolean(isPublished),
      }),
    update: async (id, payload) => {
      const row = await updateCaseStudy(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteCaseStudy,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.caseStudies.title"
        actions={
          <Button
            onClick={() => void board.addItem(true)}
            disabled={board.pending}
          >
            {t("admin.pages.caseStudies.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="casestudies"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.caseStudies.empty")}
              onRowClick={board.openItem}
              columns={[
                { key: "title", header: t("admin.cms.title"), cell: (r) => r.title },
                { key: "year", header: t("admin.cms.year"), cell: (r) => r.year ?? "—" },
                {
                  key: "status",
                  header: t("admin.status"),
                  cell: (r) => (
                    <Badge variant={r.is_published ? "default" : "secondary"}>
                      {r.is_published ? t("admin.publish") : t("admin.draft")}
                    </Badge>
                  ),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <CaseStudyEditCard
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

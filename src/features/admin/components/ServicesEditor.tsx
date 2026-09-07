"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import {
  createService,
  softDeleteService,
  updateService,
  type Service,
} from "@/services/services";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ServicesEditCard } from "./ServicesEditCard";
import { Button } from "@/components/ui/button";

type Props = { items: Service[] };

export function ServicesEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<Service>({
    initial,
    create: (sort_order) =>
      createService({
        title: t("admin.untitled"),
        title_ar: "",
        tags: [],
        description: "",
        description_ar: "",
        kind: "our_services",
        sort_order,
        is_published: true,
      }),
    update: async (id, payload) => {
      const row = await updateService(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteService,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.services.title"
        descriptionKey="admin.pages.services.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.services.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.services.empty")}
              onRowClick={board.openItem}
              columns={[
                { key: "title", header: t("admin.cms.title"), cell: (r) => r.title },
                {
                  key: "kind",
                  header: t("admin.pages.services.kind"),
                  cell: (r) =>
                    r.kind === "laser" ? t("admin.pages.services.laser") : t("admin.pages.services.ourServices"),
                },
                {
                  key: "published",
                  header: t("admin.cms.published"),
                  cell: (r) => (r.is_published ? t("admin.yes") : t("admin.no")),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <ServicesEditCard
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

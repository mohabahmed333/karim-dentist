"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createFeatured,
  softDeleteFeatured,
  updateFeatured,
  type FeaturedProject,
} from "@/services/featured_projects";
import type { AdminMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import { useBoardCrud } from "../hooks/useBoardCrud";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CollectionSplitLayout } from "./CollectionSplitLayout";
import { CollectionTable } from "./CollectionTable";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { FeaturedEditCard } from "./FeaturedEditCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  items: FeaturedProject[];
  titleKey?: AdminMessageKey;
  addLabelKey?: AdminMessageKey;
  emptyKey?: AdminMessageKey;
};

export function FeaturedEditor({
  items: initial,
  titleKey = "admin.pages.featured.title",
  addLabelKey = "admin.pages.featured.add",
  emptyKey = "admin.pages.featured.empty",
}: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<FeaturedProject>({
    initial,
    create: (sort_order, isPublished = true) =>
      createFeatured({
        title: t("admin.untitled"),
        sort_order,
        is_published: Boolean(isPublished),
      }),
    update: async (id, payload) => {
      const row = await updateFeatured(id, payload);
      toast.success(t("admin.cms.saveSuccess"));
      return row;
    },
    remove: softDeleteFeatured,
  });

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey={titleKey}
        actions={
          <Button
            onClick={() => void board.addItem(true)}
            disabled={board.pending}
          >
            {t(addLabelKey)}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="featured"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t(emptyKey)}
              onRowClick={board.openItem}
              columns={[
                { key: "title", header: t("admin.name"), cell: (r) => r.title },
                {
                  key: "media",
                  header: t("admin.media"),
                  cell: (r) => (r.image_url ? t("admin.yes") : "—"),
                },
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
            <FeaturedEditCard
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

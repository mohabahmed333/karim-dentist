"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MapPin, MessageSquarePlus, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import { useBoardCrud } from "../../hooks/useBoardCrud";
import { CollectionSplitLayout } from "../CollectionSplitLayout";
import { CollectionTable } from "../CollectionTable";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";
import { LocalizedAdminPageHeader } from "../LocalizedAdminPageHeader";
import { QuickReplyEditCard } from "./QuickReplyEditCard";
import {
  QuickReplyApiError,
  createQuickReply,
  deleteQuickReply,
  updateQuickReply,
} from "./quickRepliesApi";

type Props = { items: WhatsappCannedReply[] };

export function QuickRepliesEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const board = useBoardCrud<WhatsappCannedReply>({
    initial,
    create: (sort_order) =>
      createQuickReply({
        // A unique placeholder key, switched off: an unfinished reply must never
        // appear in a chat's / menu.
        slash_key: `new-${Date.now().toString(36)}`,
        title: t("admin.untitled"),
        body: t("admin.untitled"),
        sort_order,
        active: false,
      }),
    update: async (id, payload) => {
      try {
        const row = await updateQuickReply(id, payload);
        toast.success(t("admin.cms.saveSuccess"));
        return row;
      } catch (error) {
        if (error instanceof QuickReplyApiError && error.code === "SLASH_KEY_TAKEN") {
          throw new Error(t("admin.pages.quickReplies.slashKeyTaken"));
        }
        throw error;
      }
    },
    remove: deleteQuickReply,
  });

  const categories = useMemo(
    () =>
      [...new Set(board.items.map((reply) => reply.category?.trim()).filter((c): c is string => Boolean(c)))].sort(),
    [board.items],
  );

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.quickReplies.title"
        descriptionKey="admin.pages.quickReplies.description"
        actions={
          <Button onClick={() => void board.addItem()} disabled={board.pending}>
            {t("admin.pages.quickReplies.add")}
          </Button>
        }
      />
      <CollectionSplitLayout
        list={
          <div className="p-2">
            <CollectionTable
              tableId="whatsapp_canned_replies"
              rows={board.items}
              selectedId={board.selected?.id}
              emptyMessage={t("admin.pages.quickReplies.empty")}
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
                {
                  key: "slash_key",
                  header: t("admin.pages.quickReplies.slashKey"),
                  sortValue: (r) => r.slash_key,
                  searchValue: (r) =>
                    `${r.slash_key} ${r.title} ${r.title_ar ?? ""} ${r.body} ${r.body_ar ?? ""} ${r.category ?? ""}`,
                  cell: (r) => `/${r.slash_key}`,
                },
                {
                  key: "title",
                  header: t("admin.pages.quickReplies.titleEn"),
                  sortValue: (r) => r.title,
                  cell: (r) => (
                    <span className="inline-flex items-center gap-1.5">
                      {r.title}
                      {r.attachment ? (
                        (r.attachment as { kind?: string }).kind === "location" ? (
                          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                        ) : (
                          <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
                        )
                      ) : null}
                      {Array.isArray(r.buttons) && r.buttons.length ? (
                        <MessageSquarePlus className="size-3.5 text-muted-foreground" aria-hidden />
                      ) : null}
                    </span>
                  ),
                },
                {
                  key: "category",
                  header: t("admin.pages.quickReplies.category"),
                  sortValue: (r) => r.category ?? "",
                  cell: (r) => r.category ?? "—",
                },
                {
                  key: "uses",
                  header: t("admin.pages.quickReplies.uses"),
                  sortValue: (r) => r.use_count,
                  cell: (r) => r.use_count,
                },
                {
                  key: "active",
                  header: t("admin.pages.quickReplies.active"),
                  sortValue: (r) => (r.active ? 1 : 0),
                  cell: (r) => (r.active ? t("admin.yes") : t("admin.no")),
                },
              ]}
            />
          </div>
        }
        detail={
          board.selected ? (
            <QuickReplyEditCard
              item={board.selected}
              categories={categories}
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

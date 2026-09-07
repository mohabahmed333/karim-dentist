"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { useLocale, useTranslations } from "@/lib/i18n";
import { pickLocalized } from "@/lib/i18n/pickLocalized";

type Reply = {
  id: string;
  slash_key: string;
  title: string;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CannedRepliesPanel({ open, onOpenChange }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [slashKey, setSlashKey] = useState("");
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [body, setBody] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/v1/whatsapp/canned-replies?all=1");
    if (!res.ok) return;
    const data = (await res.json()) as { replies?: Reply[] };
    setReplies(data.replies ?? []);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [load, open]);

  async function addReply() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/whatsapp/canned-replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slash_key: slashKey.trim().toLowerCase(),
          title: title.trim(),
          title_ar: titleAr.trim() || null,
          body: body.trim(),
          body_ar: bodyAr.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSlashKey("");
      setTitle("");
      setTitleAr("");
      setBody("");
      setBodyAr("");
      toast.success(t("admin.frontDesk.cannedAdded"));
      await load();
    } catch {
      toast.error(t("admin.frontDesk.cannedAddFail"));
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setPending(true);
    try {
      const res = await fetch(
        `/api/v1/whatsapp/canned-replies?id=${deleteId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("failed");
      setDeleteId(null);
      toast.success(t("admin.frontDesk.cannedDeleted"));
      await load();
    } catch {
      toast.error(t("admin.frontDesk.cannedDeleteFail"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.frontDesk.cannedTitle")}</DialogTitle>
          </DialogHeader>
          <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {replies.map((r) => {
              const titleShown = pickLocalized(locale, r.title, r.title_ar);
              const bodyShown = pickLocalized(locale, r.body, r.body_ar);
              return (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-[#E5E7EB] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      /{r.slash_key} · {titleShown}
                    </p>
                    <p className="line-clamp-2 text-xs text-[#6B7280]">
                      {bodyShown}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("admin.delete")} ${titleShown}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </li>
              );
            })}
          </ul>
          <div className="space-y-2 border-t border-[#E5E7EB] pt-3">
            <Input
              placeholder={t("admin.frontDesk.cannedSlash")}
              value={slashKey}
              onChange={(e) => setSlashKey(e.target.value)}
            />
            <Input
              placeholder={t("admin.frontDesk.cannedName")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder={t("admin.frontDesk.cannedNameAr")}
              value={titleAr}
              dir="rtl"
              onChange={(e) => setTitleAr(e.target.value)}
            />
            <Input
              placeholder={t("admin.frontDesk.cannedBody")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Input
              placeholder={t("admin.frontDesk.cannedBodyAr")}
              value={bodyAr}
              dir="rtl"
              onChange={(e) => setBodyAr(e.target.value)}
            />
            <Button
              type="button"
              disabled={pending || !slashKey || !title || !body}
              onClick={() => void addReply()}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t("admin.add")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        title={t("admin.frontDesk.cannedDeleteTitle")}
        description={t("admin.frontDesk.cannedDeleteDesc")}
        pending={pending}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import {
  QuickReplyApiError,
  createQuickReply,
} from "@/features/admin/components/quick-replies/quickRepliesApi";
import { quickReplyFromMessage } from "./quickReplyFromMessage";
import type { SupportMessage } from "../supportDummyData";

type Props = {
  message: SupportMessage | null;
  onOpenChange: (open: boolean) => void;
};

export function SaveQuickReplyDialog({ message, onOpenChange }: Props) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await createQuickReply(
        quickReplyFromMessage(message.body, {
          slashKey: String(form.get("slash_key") ?? ""),
          title: String(form.get("title") ?? ""),
          category: String(form.get("category") ?? ""),
        }),
      );
      toast.success(t("admin.frontDesk.savedAsQuickReply"));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof QuickReplyApiError && err.code === "SLASH_KEY_TAKEN"
          ? t("admin.pages.quickReplies.slashKeyTaken")
          : t("admin.frontDesk.saveQuickReplyFail"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={Boolean(message)}
      onOpenChange={(open) => {
        if (!open) setError(null);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.frontDesk.saveAsQuickReply")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          <p className="line-clamp-4 whitespace-pre-wrap rounded-md bg-[#F3F4F6] px-3 py-2 text-sm">
            {message?.body}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-slash">{t("admin.pages.quickReplies.slashKey")}</Label>
            <Input id="save-qr-slash" name="slash_key" pattern="[A-Za-z0-9_\-]+" required />
            <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.slashKeyHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-title">{t("admin.pages.quickReplies.titleEn")}</Label>
            <Input id="save-qr-title" name="title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="save-qr-category">{t("admin.pages.quickReplies.category")}</Label>
            <Input id="save-qr-category" name="category" />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

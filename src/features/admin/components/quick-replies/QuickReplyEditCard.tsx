"use client";

import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QUICK_REPLY_FORM_ID, QuickReplyForm } from "./QuickReplyForm";

type Props = {
  item: WhatsappCannedReply;
  categories: string[];
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function QuickReplyEditCard({ item, categories, pending, message, onSubmit, onDeleteClick }: Props) {
  const t = useTranslations();
  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{t("admin.edit")}</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          {t("admin.delete")}
        </Button>
      </div>
      <QuickReplyForm
        key={item.id}
        item={item}
        categories={categories}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button className="mt-4 w-full" type="submit" form={QUICK_REPLY_FORM_ID} disabled={pending}>
        {pending ? t("admin.saving") : t("admin.save")}
      </Button>
    </Card>
  );
}

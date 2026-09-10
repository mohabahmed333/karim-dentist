"use client";

import { useTranslations } from "@/lib/i18n";
import type { ClinicKnowledge } from "@/services/clinic_knowledge";
import { KnowledgeForm } from "./KnowledgeForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  item: ClinicKnowledge;
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function KnowledgeEditCard({
  item,
  pending,
  message,
  onSubmit,
  onDeleteClick,
}: Props) {
  const t = useTranslations();
  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{t("admin.edit")}</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          {t("admin.delete")}
        </Button>
      </div>
      <KnowledgeForm
        key={item.id}
        item={item}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button className="mt-4 w-full" type="submit" form="knowledge-form" disabled={pending}>
        {pending ? t("admin.saving") : t("admin.save")}
      </Button>
    </Card>
  );
}

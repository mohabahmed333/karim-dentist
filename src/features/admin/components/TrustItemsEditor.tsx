"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import type { TrustItem } from "@/services/dental/types";
import { updateTrustItem } from "@/services/dental/mutations";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";

type Props = { items: TrustItem[] };

export function TrustItemsEditor({ items: initial }: Props) {
  const t = useTranslations();
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState(false);

  async function saveItem(item: TrustItem, partial: Partial<TrustItem>) {
    setPending(true);
    try {
      const row = await updateTrustItem(item.id, partial);
      setItems((prev) => prev.map((entry) => (entry.id === row.id ? row : entry)));
      toast.success(t("admin.cms.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.trust.title"
        descriptionKey="admin.pages.trust.description"
      />
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="gap-0 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.pages.trust.value")}</Label>
                <Input
                  defaultValue={item.value}
                  onBlur={(e) => void saveItem(item, { value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.pages.trust.labelField")}</Label>
                <Input
                  defaultValue={item.label}
                  onBlur={(e) => void saveItem(item, { label: e.target.value })}
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-3"
              disabled={pending}
              onClick={() => void saveItem(item, {})}
            >
              {t("admin.save")}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

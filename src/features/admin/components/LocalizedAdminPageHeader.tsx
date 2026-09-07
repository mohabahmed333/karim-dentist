"use client";

import type { ReactNode } from "react";
import type { AdminMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import { AdminPageHeader } from "./AdminPageHeader";

type Props = {
  titleKey: AdminMessageKey;
  descriptionKey?: AdminMessageKey;
  actions?: ReactNode;
};

export function LocalizedAdminPageHeader({
  titleKey,
  descriptionKey,
  actions,
}: Props) {
  const t = useTranslations();
  return (
    <AdminPageHeader
      title={t(titleKey)}
      description={descriptionKey ? t(descriptionKey) : undefined}
      actions={actions}
    />
  );
}

"use client";

import { useTranslations } from "@/lib/i18n";

type Props = {
  href: string;
  children?: string;
};

/** External/public destination — always an anchor, never a button. */
export function EditorOpenPageLink({ href, children }: Props) {
  const t = useTranslations();
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 text-[10px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
    >
      {children ?? t("admin.customize.openPage")}
    </a>
  );
}

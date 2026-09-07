"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AdminIconRail } from "./AdminIconRail";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";

type Props = {
  pendingCount?: number;
};

export function AdminMobileNav({ pendingCount = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("admin.nav.admin")}
      >
        <Menu className="size-5" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("admin.close")}
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full bg-[var(--admin-canvas)]">
            <AdminIconRail />
            <div className="flex w-64 flex-col border-s border-[var(--admin-border)]">
              <div className="flex justify-end p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("admin.close")}
                >
                  <X className="size-5" />
                </Button>
              </div>
              <AdminSidebar pendingCount={pendingCount} mobile />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
